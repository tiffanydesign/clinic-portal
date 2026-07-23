import React, { useState } from "react";
import { toast } from "sonner";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";

export function RejectReasonModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");

  const submit = () => {
    if (!reason.trim()) { toast.error("A reason is required to reject this request."); return; }
    onConfirm(reason.trim());
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title="Reject Request"
      size="confirm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={submit}>Reject Request</Button>
        </>
      }
    >
      <p className="text-body text-ink-soft leading-relaxed mb-4">
        This reason will be sent to the employee.
      </p>
      <label className="block text-label font-bold text-ink-soft uppercase tracking-wider mb-1.5">
        Reason <span className="text-danger-ink">*</span>
      </label>
      <Textarea
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="e.g. Insufficient staffing that week"
        className="resize-none"
      />
    </Modal>
  );
}
