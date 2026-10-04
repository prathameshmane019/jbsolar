"use client";

import { EditForm, type EditableSection } from "./record-forms";
import { Icon, Modal, RecordDetails } from "./ui";
import type { RecordFormSubmit, RecordSelection, ReferenceData, Row } from "./types";

export function RecordDetailsDialog({
  record,
  loading,
  onClose,
}: {
  record: RecordSelection;
  loading: boolean;
  onClose: () => void;
}) {
  const label = record.section === "Recycle Bin" ? "Deleted record" : record.section === "Policies" ? "Policy" : record.section.slice(0, -1);
  return (
    <Modal title={`${label} details`} onClose={onClose}>
      <RecordDetails record={record.row} loading={loading} />
    </Modal>
  );
}

export function RecordEditDialog({
  record,
  data,
  saving,
  onSubmit,
  onClose,
}: {
  record: { section: EditableSection; row: Row };
  data: ReferenceData;
  saving: boolean;
  onSubmit: RecordFormSubmit;
  onClose: () => void;
}) {
  return (
    <Modal title={`Edit ${record.section === "Vendors" ? "vendor" : "plan"}`} onClose={onClose}>
      <EditForm record={record} data={data} onSubmit={onSubmit} onCancel={onClose} saving={saving} />
    </Modal>
  );
}

export function RecordDeleteDialog({
  record,
  deleting,
  onDelete,
  onClose,
}: {
  record: RecordSelection;
  deleting: boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  const recordName = String(record.row.policyNumber ?? record.row.fullName ?? record.row.name ?? record.row.id);
  return (
    <Modal title="Delete record?" onClose={onClose}>
      <p className="text-[12px] leading-5 text-[#687266]">This will request deletion of <strong className="font-semibold text-[#293629]">{recordName}</strong> from the API. The record will only be removed here after the server confirms success.</p>
      <p className="mt-3 rounded-[5px] bg-[#fff5ed] px-3 py-2 text-[10px] leading-4 text-[#9e6041]">This record will move to the recycle bin and can be restored later.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" disabled={deleting} onClick={onClose} className="h-9 rounded-[5px] px-3 text-[11px] font-semibold text-[#626b60] hover:bg-[#f1f3ee]">Cancel</button>
        <button type="button" disabled={deleting} onClick={onDelete} className="inline-flex h-9 items-center gap-2 rounded-[5px] bg-[#a94335] px-4 text-[11px] font-semibold text-white hover:bg-[#90392e] disabled:opacity-60"><Icon name="trash" size={14} />{deleting ? "Deleting..." : "Delete"}</button>
      </div>
    </Modal>
  );
}

export function RecycleBinPurgeDialog({
  record,
  deleting,
  onDelete,
  onClose,
}: {
  record: RecordSelection;
  deleting: boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  const label = String(record.row.label ?? record.row.id);
  return (
    <Modal title="Permanently delete record?" onClose={onClose}>
      <p className="text-[12px] leading-5 text-[#687266]"><strong className="font-semibold text-[#293629]">{label}</strong> will be permanently deleted and cannot be restored.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" disabled={deleting} onClick={onClose} className="h-9 rounded-[5px] px-3 text-[11px] font-semibold text-[#626b60] hover:bg-[#f1f3ee]">Cancel</button>
        <button type="button" disabled={deleting} onClick={onDelete} className="inline-flex h-9 items-center gap-2 rounded-[5px] bg-[#a94335] px-4 text-[11px] font-semibold text-white hover:bg-[#90392e] disabled:opacity-60"><Icon name="trash" size={14} />{deleting ? "Deleting..." : "Delete permanently"}</button>
      </div>
    </Modal>
  );
}
