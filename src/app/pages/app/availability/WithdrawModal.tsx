import React from "react";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";

export function WithdrawModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal
      open
      onClose={onCancel}
      title="Withdraw Request?"
      size="confirm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Withdraw</Button>
        </>
      }
    >
      <p className="text-body text-ink-soft leading-relaxed">
        Your pending request will be removed. You can then make new availability changes.
      </p>
    </Modal>
  );
}
