import React from "react";
import { PendingRequest, Decision } from "./availabilityData";
import { PendingRequestsSection } from "./PendingRequestsSection";
import { Modal } from "../../../components/ui/modal";

// Top-bar "Requests" button opens this — the single place request status
// lives now (no right-column card). Only one Leave request can ever be
// Pending at a time (see availabilityStore.hasPendingRequest), so the
// popup's "current request" area shows at most one card; history is always
// reachable below via "Recent decisions".
export function RequestCentreModal({ pending, decisions, onWithdraw, onClose }: {
  pending: PendingRequest[];
  decisions: Decision[];
  onWithdraw: (req: PendingRequest) => void;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title="Requests" size="confirm">
      <p className="text-label text-ink-muted mb-3">Your current request and its decision history.</p>
      <PendingRequestsSection pending={pending} decisions={decisions} onWithdraw={onWithdraw} variant="bare" />
    </Modal>
  );
}
