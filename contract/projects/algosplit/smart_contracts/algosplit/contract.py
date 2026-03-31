from algopy import (
    ARC4Contract,
    Account,
    Bytes,
    Global,
    Txn,
    UInt64,
    gtxn,
    op,
    subroutine,
    urange,
)
from algopy.arc4 import abimethod, Bool, String, UInt64 as ARC4UInt64, DynamicArray, Struct


class Bill(Struct):
    """Bill box structure"""
    creator: Account
    total_amount: UInt64
    member_count: UInt64
    settled_count: UInt64
    is_settled: Bool


class Member(Struct):
    """Member box structure"""
    share: UInt64
    paid: Bool


class Algosplit(ARC4Contract):
    """AlgoSplit - On-chain Split Bill Settlement Smart Contract"""

    def __init__(self) -> None:
        """Initialize contract with bill counter"""
        self.bill_counter = UInt64(0)

    @abimethod()
    def create_bill(
        self,
        members: DynamicArray[Account],
        shares: DynamicArray[ARC4UInt64],
        mbr_payment: gtxn.PaymentTransaction,
    ) -> ARC4UInt64:
        """
        Create a new bill with members and their shares
        
        Args:
            members: List of member addresses
            shares: List of share amounts for each member
            mbr_payment: Payment transaction for box storage MBR
            
        Returns:
            Bill ID
        """
        # Validate inputs
        assert members.length == shares.length, "Members and shares length mismatch"
        assert members.length > 0, "At least one member required"
        
        # Verify MBR payment
        assert mbr_payment.receiver == Global.current_application_address, "MBR payment must go to app"
        
        # Increment bill counter
        self.bill_counter += 1
        bill_id = self.bill_counter
        
        # Calculate total amount
        total_amount = UInt64(0)
        for i in urange(members.length):
            share_amount = shares[i].native
            assert share_amount > 0, "Share must be greater than 0"
            total_amount += share_amount
        
        # Create bill box
        bill_key = self._get_bill_key(bill_id)
        bill = Bill(
            creator=Txn.sender,
            total_amount=total_amount,
            member_count=members.length,
            settled_count=UInt64(0),
            is_settled=Bool(False),
        )
        op.Box.put(bill_key, bill.bytes)
        
        # Create member boxes
        for i in urange(members.length):
            member_address = members[i]
            share_amount = shares[i].native
            
            member_key = self._get_member_key(bill_id, member_address)
            member = Member(
                share=share_amount,
                paid=Bool(False),
            )
            op.Box.put(member_key, member.bytes)
            
            # Add bill to user's participation list
            self._add_bill_to_user(member_address, bill_id)
        
        return ARC4UInt64(bill_id)

    @abimethod()
    def pay_bill(
        self,
        bill_id: ARC4UInt64,
        payment: gtxn.PaymentTransaction,
    ) -> Bool:
        """
        Pay a bill share (grouped with payment transaction)
        
        Args:
            bill_id: The bill ID to pay
            payment: Payment transaction to bill creator
            
        Returns:
            Success status
        """
        bill_id_native = bill_id.native
        
        # Load bill
        bill_key = self._get_bill_key(bill_id_native)
        bill_bytes, exists = op.Box.get(bill_key)
        assert exists, "Bill does not exist"
        bill = Bill.from_bytes(bill_bytes)
        
        assert not bill.is_settled.native, "Bill already settled"
        
        # Load member
        member_key = self._get_member_key(bill_id_native, Txn.sender)
        member_bytes, member_exists = op.Box.get(member_key)
        assert member_exists, "Not a member of this bill"
        member = Member.from_bytes(member_bytes)
        
        assert not member.paid.native, "Already paid"
        
        # Verify payment transaction
        assert payment.sender == Txn.sender, "Payment sender mismatch"
        assert payment.receiver == bill.creator, "Payment must go to bill creator"
        assert payment.amount == member.share, "Payment amount must match share"
        
        # Update member status
        member.paid = Bool(True)
        op.Box.put(member_key, member.bytes)
        
        # Update bill status
        bill.settled_count += 1
        if bill.settled_count == bill.member_count:
            bill.is_settled = Bool(True)
        op.Box.put(bill_key, bill.bytes)
        
        return Bool(True)

    @abimethod(readonly=True)
    def get_bill(self, bill_id: ARC4UInt64) -> Bill:
        """
        Get bill details
        
        Args:
            bill_id: The bill ID
            
        Returns:
            Bill struct
        """
        bill_key = self._get_bill_key(bill_id.native)
        bill_bytes, exists = op.Box.get(bill_key)
        assert exists, "Bill does not exist"
        return Bill.from_bytes(bill_bytes)

    @abimethod(readonly=True)
    def get_member(self, bill_id: ARC4UInt64, member: Account) -> Member:
        """
        Get member details for a bill
        
        Args:
            bill_id: The bill ID
            member: Member address
            
        Returns:
            Member struct
        """
        member_key = self._get_member_key(bill_id.native, member)
        member_bytes, exists = op.Box.get(member_key)
        assert exists, "Member not found"
        return Member.from_bytes(member_bytes)

    @abimethod(readonly=True)
    def get_user_bills(self, user: Account) -> DynamicArray[ARC4UInt64]:
        """
        Get all bills for a user
        
        Args:
            user: User address
            
        Returns:
            Array of bill IDs
        """
        user_key = self._get_user_key(user)
        user_bills_bytes, exists = op.Box.get(user_key)
        
        if not exists:
            return DynamicArray[ARC4UInt64]()
        
        return DynamicArray[ARC4UInt64].from_bytes(user_bills_bytes)

    @abimethod(readonly=True)
    def get_bill_counter(self) -> ARC4UInt64:
        """Get current bill counter"""
        return ARC4UInt64(self.bill_counter)

    @abimethod()
    def cancel_bill(self, bill_id: ARC4UInt64) -> Bool:
        """
        Cancel a bill (only creator can cancel, only if no payments made)
        
        Args:
            bill_id: The bill ID to cancel
            
        Returns:
            Success status
        """
        bill_id_native = bill_id.native
        
        # Load bill
        bill_key = self._get_bill_key(bill_id_native)
        bill_bytes, exists = op.Box.get(bill_key)
        assert exists, "Bill does not exist"
        bill = Bill.from_bytes(bill_bytes)
        
        # Only creator can cancel
        assert Txn.sender == bill.creator, "Only creator can cancel bill"
        
        # Can only cancel if no payments made
        assert bill.settled_count == 0, "Cannot cancel bill with payments"
        
        # Mark as settled to prevent future payments
        bill.is_settled = Bool(True)
        op.Box.put(bill_key, bill.bytes)
        
        return Bool(True)

    @abimethod()
    def update_member_share(
        self,
        bill_id: ARC4UInt64,
        member: Account,
        new_share: ARC4UInt64,
    ) -> Bool:
        """
        Update a member's share (only creator, only if member hasn't paid)
        
        Args:
            bill_id: The bill ID
            member: Member address to update
            new_share: New share amount
            
        Returns:
            Success status
        """
        bill_id_native = bill_id.native
        new_share_native = new_share.native
        
        # Load bill
        bill_key = self._get_bill_key(bill_id_native)
        bill_bytes, exists = op.Box.get(bill_key)
        assert exists, "Bill does not exist"
        bill = Bill.from_bytes(bill_bytes)
        
        # Only creator can update
        assert Txn.sender == bill.creator, "Only creator can update shares"
        assert not bill.is_settled.native, "Cannot update settled bill"
        
        # Load member
        member_key = self._get_member_key(bill_id_native, member)
        member_bytes, member_exists = op.Box.get(member_key)
        assert member_exists, "Member not found"
        member_data = Member.from_bytes(member_bytes)
        
        # Can only update if member hasn't paid
        assert not member_data.paid.native, "Cannot update paid member"
        assert new_share_native > 0, "Share must be greater than 0"
        
        # Update total amount
        old_share = member_data.share
        bill.total_amount = bill.total_amount - old_share + new_share_native
        
        # Update member share
        member_data.share = new_share_native
        op.Box.put(member_key, member_data.bytes)
        op.Box.put(bill_key, bill.bytes)
        
        return Bool(True)

    @abimethod()
    def remove_member(
        self,
        bill_id: ARC4UInt64,
        member: Account,
    ) -> Bool:
        """
        Remove a member from bill (only creator, only if member hasn't paid)
        
        Args:
            bill_id: The bill ID
            member: Member address to remove
            
        Returns:
            Success status
        """
        bill_id_native = bill_id.native
        
        # Load bill
        bill_key = self._get_bill_key(bill_id_native)
        bill_bytes, exists = op.Box.get(bill_key)
        assert exists, "Bill does not exist"
        bill = Bill.from_bytes(bill_bytes)
        
        # Only creator can remove
        assert Txn.sender == bill.creator, "Only creator can remove members"
        assert not bill.is_settled.native, "Cannot modify settled bill"
        assert bill.member_count > 1, "Cannot remove last member"
        
        # Load member
        member_key = self._get_member_key(bill_id_native, member)
        member_bytes, member_exists = op.Box.get(member_key)
        assert member_exists, "Member not found"
        member_data = Member.from_bytes(member_bytes)
        
        # Can only remove if member hasn't paid
        assert not member_data.paid.native, "Cannot remove paid member"
        
        # Update bill
        bill.total_amount -= member_data.share
        bill.member_count -= 1
        op.Box.put(bill_key, bill.bytes)
        
        # Delete member box
        deleted = op.Box.delete(member_key)
        assert deleted, "Failed to delete member box"
        
        # Remove bill from user's list
        self._remove_bill_from_user(member, bill_id_native)
        
        return Bool(True)

    @abimethod()
    def add_member(
        self,
        bill_id: ARC4UInt64,
        member: Account,
        share: ARC4UInt64,
        mbr_payment: gtxn.PaymentTransaction,
    ) -> Bool:
        """
        Add a new member to existing bill (only creator, only if bill not settled)
        
        Args:
            bill_id: The bill ID
            member: New member address
            share: Share amount for new member
            mbr_payment: Payment for box storage MBR
            
        Returns:
            Success status
        """
        bill_id_native = bill_id.native
        share_native = share.native
        
        # Verify MBR payment
        assert mbr_payment.receiver == Global.current_application_address, "MBR payment must go to app"
        
        # Load bill
        bill_key = self._get_bill_key(bill_id_native)
        bill_bytes, exists = op.Box.get(bill_key)
        assert exists, "Bill does not exist"
        bill = Bill.from_bytes(bill_bytes)
        
        # Only creator can add
        assert Txn.sender == bill.creator, "Only creator can add members"
        assert not bill.is_settled.native, "Cannot modify settled bill"
        assert share_native > 0, "Share must be greater than 0"
        
        # Check member doesn't already exist
        member_key = self._get_member_key(bill_id_native, member)
        existing_member_bytes, member_exists = op.Box.get(member_key)
        assert not member_exists, "Member already exists"
        
        # Create member box
        new_member = Member(
            share=share_native,
            paid=Bool(False),
        )
        op.Box.put(member_key, new_member.bytes)
        
        # Update bill
        bill.total_amount += share_native
        bill.member_count += 1
        op.Box.put(bill_key, bill.bytes)
        
        # Add bill to user's participation list
        self._add_bill_to_user(member, bill_id_native)
        
        return Bool(True)

    @subroutine
    def _get_bill_key(self, bill_id: UInt64) -> Bytes:
        """Generate bill box key"""
        return Bytes(b"bill_") + op.itob(bill_id)

    @subroutine
    def _get_member_key(self, bill_id: UInt64, member: Account) -> Bytes:
        """Generate member box key"""
        return Bytes(b"bill_") + op.itob(bill_id) + Bytes(b"_member_") + member.bytes

    @subroutine
    def _get_user_key(self, user: Account) -> Bytes:
        """Generate user participation box key"""
        return Bytes(b"user_") + user.bytes

    @subroutine
    def _add_bill_to_user(self, user: Account, bill_id: UInt64) -> None:
        """Add bill ID to user's participation list"""
        user_key = self._get_user_key(user)
        user_bills_bytes, exists = op.Box.get(user_key)
        
        if exists:
            # Append to existing list
            user_bills = DynamicArray[ARC4UInt64].from_bytes(user_bills_bytes)
            user_bills.append(ARC4UInt64(bill_id))
            op.Box.put(user_key, user_bills.bytes)
        else:
            # Create new list
            user_bills = DynamicArray[ARC4UInt64](ARC4UInt64(bill_id))
            op.Box.put(user_key, user_bills.bytes)

    @subroutine
    def _remove_bill_from_user(self, user: Account, bill_id: UInt64) -> None:
        """Remove bill ID from user's participation list"""
        user_key = self._get_user_key(user)
        user_bills_bytes, exists = op.Box.get(user_key)
        
        if exists:
            user_bills = DynamicArray[ARC4UInt64].from_bytes(user_bills_bytes)
            
            # Find and remove the bill_id
            for i in urange(user_bills.length):
                if user_bills[i].native == bill_id:
                    # Create new array without this bill
                    new_bills = DynamicArray[ARC4UInt64]()
                    for j in urange(user_bills.length):
                        if j != i:
                            new_bills.append(user_bills[j])
                    
                    if new_bills.length > 0:
                        op.Box.put(user_key, new_bills.bytes)
                    else:
                        # Delete box if empty
                        deleted = op.Box.delete(user_key)
                        assert deleted, "Failed to delete user box"
                    break
