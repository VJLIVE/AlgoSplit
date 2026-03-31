import algosdk from 'algosdk';
import { algodClient, APP_ID } from './algorand';

export interface Bill {
  creator: string;
  totalAmount: bigint;
  memberCount: bigint;
  settledCount: bigint;
  isSettled: boolean;
}

export interface Member {
  share: bigint;
  paid: boolean;
}

// Box MBR calculation (2500 + 400 per byte)
const BOX_FLAT_MIN_BALANCE = 2500;
const BOX_BYTE_MIN_BALANCE = 400;

export function calculateBoxMBR(boxSize: number): number {
  return BOX_FLAT_MIN_BALANCE + (boxSize * BOX_BYTE_MIN_BALANCE);
}

// Get current bill counter from contract
export async function getBillCounter(): Promise<number> {
  try {
    const appInfo = await algodClient.getApplicationByID(APP_ID).do();
    const globalState = appInfo.params.globalState;
    
    // Find bill_counter in global state
    const billCounterKey = Buffer.from('bill_counter').toString('base64');
    const billCounterState = globalState?.find((item) => {
      const keyStr = Buffer.from(item.key).toString('base64');
      return keyStr === billCounterKey;
    });
    
    if (billCounterState && billCounterState.value.type === 2) {
      return Number(billCounterState.value.uint);
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting bill counter:', error);
    return 0;
  }
}

// Create bill transaction
export async function createBillTransaction(
  sender: string,
  members: string[],
  shares: number[], // in microAlgos
): Promise<algosdk.Transaction[]> {
  const suggestedParams = await algodClient.getTransactionParams().do();
  
  // Calculate proper MBR for boxes
  // Box MBR = 2500 + 400 * box_size (in microAlgos)
  const BOX_FLAT_MBR = 2500;
  const BOX_BYTE_MBR = 400;
  
  // Bill box: 32 (Account) + 8 (UInt64) + 8 (UInt64) + 8 (UInt64) + 1 (Bool) = 57 bytes
  const billBoxSize = 57;
  const billBoxMBR = BOX_FLAT_MBR + (BOX_BYTE_MBR * billBoxSize);
  
  // Member box: 8 (UInt64) + 1 (Bool) = 9 bytes
  const memberBoxSize = 9;
  const memberBoxMBR = BOX_FLAT_MBR + (BOX_BYTE_MBR * memberBoxSize);
  
  // User box: For each member, estimate minimal growth
  // New box: 2500 + 400 * (2 + 8) = 6500 microAlgos (1 bill)
  const userBoxMBR = BOX_FLAT_MBR + (BOX_BYTE_MBR * (2 + 8)); // Just 1 bill worth
  
  // Total MBR: 1 bill box + N member boxes + N user boxes
  // Add extra buffer for account minimum balance increase
  const boxesMBR = billBoxMBR + (members.length * (memberBoxMBR + userBoxMBR));
  const bufferMBR = 150000; // 0.15 ALGO buffer for account min balance
  const totalMBR = boxesMBR + bufferMBR;
  
  console.log('MBR Calculation:');
  console.log('Bill box MBR:', billBoxMBR / 1_000_000, 'ALGO');
  console.log('Member box MBR (each):', memberBoxMBR / 1_000_000, 'ALGO');
  console.log('User box MBR (each):', userBoxMBR / 1_000_000, 'ALGO');
  console.log('Boxes MBR:', boxesMBR / 1_000_000, 'ALGO');
  console.log('Buffer MBR:', bufferMBR / 1_000_000, 'ALGO');
  console.log('Total MBR:', totalMBR / 1_000_000, 'ALGO');

  // MBR payment transaction
  const mbrPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver: algosdk.getApplicationAddress(APP_ID),
    amount: totalMBR,
    suggestedParams,
  });

  // Create ABI method for proper encoding
  const createBillMethod = new algosdk.ABIMethod({
    name: 'create_bill',
    args: [
      { type: 'address[]', name: 'members' },
      { type: 'uint64[]', name: 'shares' },
      { type: 'pay', name: 'mbr_payment' },
    ],
    returns: { type: 'uint64' },
  });

  // Encode method arguments
  const methodSelector = createBillMethod.getSelector();
  
  // Encode members array
  const membersType = algosdk.ABIType.from('address[]');
  const membersEncoded = membersType.encode(
    members.map(addr => algosdk.decodeAddress(addr).publicKey)
  );

  // Encode shares array
  const sharesType = algosdk.ABIType.from('uint64[]');
  const sharesEncoded = sharesType.encode(shares.map(s => BigInt(s)));

  // Get current bill counter to predict next bill ID
  const currentCounter = await getBillCounter();
  const nextBillId = currentCounter + 1;
  
  // Helper function to encode uint64 as big-endian bytes
  const encodeUint64 = (value: number): Uint8Array => {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigUint64(0, BigInt(value), false);
    return bytes;
  };
  
  // Create box references
  const boxes: algosdk.BoxReference[] = [];
  
  // Bill box: "bill_<id>"
  const billBoxName = new Uint8Array([
    ...Buffer.from('bill_'),
    ...encodeUint64(nextBillId),
  ]);
  boxes.push({ appIndex: APP_ID, name: billBoxName });
  
  // Member boxes: "bill_<id>_member_<address>"
  for (const memberAddr of members) {
    const memberBoxName = new Uint8Array([
      ...Buffer.from('bill_'),
      ...encodeUint64(nextBillId),
      ...Buffer.from('_member_'),
      ...algosdk.decodeAddress(memberAddr).publicKey,
    ]);
    boxes.push({ appIndex: APP_ID, name: memberBoxName });
  }
  
  // User boxes: "user_<address>"
  for (const memberAddr of members) {
    const userBoxName = new Uint8Array([
      ...Buffer.from('user_'),
      ...algosdk.decodeAddress(memberAddr).publicKey,
    ]);
    boxes.push({ appIndex: APP_ID, name: userBoxName });
  }

  // Create application call
  const appCall = algosdk.makeApplicationNoOpTxnFromObject({
    sender,
    appIndex: APP_ID,
    appArgs: [
      methodSelector,
      membersEncoded,
      sharesEncoded,
    ],
    boxes,
    suggestedParams,
  });

  // Group transactions
  const txns = [mbrPayment, appCall];
  algosdk.assignGroupID(txns);

  return txns;
}

// Pay bill transaction
export async function payBillTransaction(
  sender: string,
  billId: number,
  billCreator: string,
  amount: number, // in microAlgos
): Promise<algosdk.Transaction[]> {
  const suggestedParams = await algodClient.getTransactionParams().do();

  // Payment to bill creator
  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver: billCreator,
    amount,
    suggestedParams,
  });

  // Create ABI method
  const payBillMethod = new algosdk.ABIMethod({
    name: 'pay_bill',
    args: [
      { type: 'uint64', name: 'bill_id' },
      { type: 'pay', name: 'payment' },
    ],
    returns: { type: 'bool' },
  });

  // Encode method arguments
  const methodSelector = payBillMethod.getSelector();
  const billIdType = algosdk.ABIType.from('uint64');
  const billIdEncoded = billIdType.encode(BigInt(billId));

  // Helper function to encode uint64 as big-endian bytes
  const encodeUint64 = (value: number): Uint8Array => {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigUint64(0, BigInt(value), false);
    return bytes;
  };

  // Create box references for the boxes that will be accessed
  const boxes: algosdk.BoxReference[] = [];
  
  // Bill box: "bill_<id>"
  const billBoxName = new Uint8Array([
    ...Buffer.from('bill_'),
    ...encodeUint64(billId),
  ]);
  boxes.push({ appIndex: APP_ID, name: billBoxName });
  
  // Member box: "bill_<id>_member_<address>"
  const memberBoxName = new Uint8Array([
    ...Buffer.from('bill_'),
    ...encodeUint64(billId),
    ...Buffer.from('_member_'),
    ...algosdk.decodeAddress(sender).publicKey,
  ]);
  boxes.push({ appIndex: APP_ID, name: memberBoxName });

  // Application call
  const appCall = algosdk.makeApplicationNoOpTxnFromObject({
    sender,
    appIndex: APP_ID,
    appArgs: [
      methodSelector,
      billIdEncoded,
    ],
    boxes,
    suggestedParams,
  });

  // Group transactions
  const txns = [payment, appCall];
  algosdk.assignGroupID(txns);

  return txns;
}

// Get bill details by reading box from indexer
export async function getBill(billId: number): Promise<Bill | null> {
  try {
    const billBoxName = new Uint8Array([
      ...Buffer.from('bill_'),
      ...algosdk.encodeUint64(billId),
    ]);
    
    const boxResponse = await algodClient.getApplicationBoxByName(APP_ID, billBoxName).do();
    const boxValue = boxResponse.value;
    
    // Parse Bill struct: (address, uint64, uint64, uint64, bool)
    // address: 32 bytes, uint64: 8 bytes each, bool: 1 byte
    const creator = algosdk.encodeAddress(new Uint8Array(boxValue.slice(0, 32)));
    const totalAmount = BigInt('0x' + Buffer.from(boxValue.slice(32, 40)).toString('hex'));
    const memberCount = BigInt('0x' + Buffer.from(boxValue.slice(40, 48)).toString('hex'));
    const settledCount = BigInt('0x' + Buffer.from(boxValue.slice(48, 56)).toString('hex'));
    const isSettled = boxValue[56] !== 0;

    return {
      creator,
      totalAmount,
      memberCount,
      settledCount,
      isSettled,
    };
  } catch (error) {
    console.error('Error getting bill:', error);
    return null;
  }
}

// Get member details by reading box from indexer
export async function getMember(billId: number, memberAddress: string): Promise<Member | null> {
  try {
    const memberBoxName = new Uint8Array([
      ...Buffer.from('bill_'),
      ...algosdk.encodeUint64(billId),
      ...Buffer.from('_member_'),
      ...algosdk.decodeAddress(memberAddress).publicKey,
    ]);
    
    const boxResponse = await algodClient.getApplicationBoxByName(APP_ID, memberBoxName).do();
    const boxValue = boxResponse.value;
    
    // Parse Member struct: (uint64, bool)
    // uint64: 8 bytes, bool: 1 byte
    const share = BigInt('0x' + Buffer.from(boxValue.slice(0, 8)).toString('hex'));
    const paid = boxValue[8] !== 0;

    return { share, paid };
  } catch (error: any) {
    // Box not found is expected if the user is the creator (not a member)
    if (error?.message?.includes('box not found') || error?.status === 404) {
      // Silently return null - this is expected for bill creators
      return null;
    }
    console.error('Error getting member:', error);
    return null;
  }
}

// Get user bills by reading box from indexer
export async function getUserBills(userAddress: string): Promise<number[]> {
  try {
    const userBoxName = new Uint8Array([
      ...Buffer.from('user_'),
      ...algosdk.decodeAddress(userAddress).publicKey,
    ]);
    
    // First check if the box exists to avoid 404 errors in console
    try {
      const boxes = await algodClient.getApplicationBoxes(APP_ID).do();
      const boxNameBase64 = Buffer.from(userBoxName).toString('base64');
      const boxExists = boxes.boxes.some((box: any) => 
        Buffer.from(box.name).toString('base64') === boxNameBase64
      );
      
      if (!boxExists) {
        // Box doesn't exist - user hasn't been added to any bills as a member
        return [];
      }
    } catch (checkError) {
      // If we can't check boxes, try to fetch anyway
      console.error('Error checking boxes:', checkError);
    }
    
    const boxResponse = await algodClient.getApplicationBoxByName(APP_ID, userBoxName).do();
    const boxValue = boxResponse.value;
    
    // Parse dynamic array of uint64
    // First 2 bytes: array length
    const length = (boxValue[0] << 8) | boxValue[1];
    const billIds: number[] = [];
    
    for (let i = 0; i < length; i++) {
      const offset = 2 + (i * 8);
      const billId = Number(BigInt('0x' + Buffer.from(boxValue.slice(offset, offset + 8)).toString('hex')));
      billIds.push(billId);
    }

    return billIds;
  } catch (error: any) {
    // Box not found is expected if user hasn't been added to any bills as a member
    // This happens when user only created bills but isn't a member of any
    if (error?.message?.includes('box not found') || error?.status === 404) {
      // Silently return empty array - this is expected behavior
      return [];
    }
    // Only log unexpected errors
    console.error('Error getting user bills:', error);
    return [];
  }
}

// Get all bills where user is the creator
export async function getBillsCreatedBy(creatorAddress: string): Promise<number[]> {
  try {
    // Get current bill counter
    const currentCounter = await getBillCounter();
    const billIds: number[] = [];
    
    // Check each bill to see if this user is the creator
    for (let i = 1; i <= currentCounter; i++) {
      const bill = await getBill(i);
      if (bill && bill.creator === creatorAddress) {
        billIds.push(i);
      }
    }
    
    return billIds;
  } catch (error) {
    console.error('Error getting bills created by user:', error);
    return [];
  }
}

// Get all member addresses for a bill by listing boxes
export async function getBillMembers(billId: number): Promise<string[]> {
  try {
    // Get all boxes for the application
    const boxes = await algodClient.getApplicationBoxes(APP_ID).do();
    
    // Filter boxes that match pattern: bill_<id>_member_<address>
    const billPrefix = Buffer.concat([
      Buffer.from('bill_'),
      Buffer.from(algosdk.encodeUint64(billId)),
      Buffer.from('_member_'),
    ]);
    
    const memberAddresses: string[] = [];
    
    for (const box of boxes.boxes) {
      const boxName = Buffer.from(box.name);
      
      // Check if this box is a member box for this bill
      if (boxName.length === billPrefix.length + 32 && 
          boxName.subarray(0, billPrefix.length).equals(billPrefix)) {
        // Extract the 32-byte address from the box name
        const addressBytes = boxName.subarray(billPrefix.length);
        const address = algosdk.encodeAddress(addressBytes);
        memberAddresses.push(address);
      }
    }
    
    return memberAddresses;
  } catch (error) {
    console.error('Error getting bill members:', error);
    return [];
  }
}

// Cancel bill transaction
export async function cancelBillTransaction(
  sender: string,
  billId: number,
): Promise<algosdk.Transaction> {
  const suggestedParams = await algodClient.getTransactionParams().do();

  // Create ABI method
  const cancelBillMethod = new algosdk.ABIMethod({
    name: 'cancel_bill',
    args: [{ type: 'uint64', name: 'bill_id' }],
    returns: { type: 'bool' },
  });

  const methodSelector = cancelBillMethod.getSelector();
  const billIdType = algosdk.ABIType.from('uint64');
  const billIdEncoded = billIdType.encode(BigInt(billId));

  // Generate bill box key
  const billIdBytes = new Uint8Array(8);
  new DataView(billIdBytes.buffer).setBigUint64(0, BigInt(billId), false);
  const billBoxName = new Uint8Array([
    ...Buffer.from('bill_'),
    ...billIdBytes,
  ]);

  return algosdk.makeApplicationNoOpTxnFromObject({
    sender,
    appIndex: APP_ID,
    appArgs: [
      methodSelector,
      billIdEncoded,
    ],
    boxes: [
      {
        appIndex: APP_ID,
        name: billBoxName,
      },
    ],
    suggestedParams,
  });
}
