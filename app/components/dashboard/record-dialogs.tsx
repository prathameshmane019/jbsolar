"use client";

import { useState } from "react";
import { EditForm, type EditableSection } from "./record-forms";
import { Icon, Modal, RecordDetails } from "./ui";
import type { PolicyFileMetadata, RecordFormSubmit, RecordSelection, ReferenceData, Row } from "./types";

export function RecordDetailsDialog({
  record,
  loading,
  policyFiles,
  policyFilesLoading,
  policyFilesError,
  onLoadPolicyFiles,
  onClose,
}: {
  record: RecordSelection;
  loading: boolean;
  policyFiles: PolicyFileMetadata[] | null;
  policyFilesLoading: boolean;
  policyFilesError: string;
  onLoadPolicyFiles: () => void;
  onClose: () => void;
}) {
  const label = record.section === "Recycle Bin" ? "Deleted record" : record.section === "Policies" ? "Policy" : record.section.slice(0, -1);
  const policyId = record.section === "Policies" ? String(record.row.id ?? "") : "";
  const [expiredFileIds, setExpiredFileIds] = useState<Set<string>>(() => new Set());
  return (
    <Modal title={`${label} details`} onClose={onClose}>
      <RecordDetails record={record.row} loading={loading} />
      {record.section === "Policies" && <section aria-labelledby="policy-files-title" className="mt-6 border-t border-[#edf0e9] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 id="policy-files-title" className="text-[12px] font-semibold text-[#293629]">Policy documents</h3>
            <p className="mt-1 text-[10px] text-[#788276]">Documents are loaded only when you request them.</p>
          </div>
          <button
            type="button"
            disabled={policyFilesLoading || !policyId}
            onClick={() => { setExpiredFileIds(new Set()); onLoadPolicyFiles(); }}
            className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-[#dfe3da] px-3 text-[10px] font-semibold text-[#435143] hover:bg-[#f5f7f1] disabled:cursor-wait disabled:opacity-60"
          >
            <Icon name={policyFiles ? "refresh" : "file"} size={13} />
            {policyFilesLoading ? "Loading documents..." : policyFiles ? "Refresh documents" : "Load documents"}
          </button>
        </div>
        {policyFilesError && <p role="alert" className="mt-3 rounded-[5px] bg-[#fff5f1] px-3 py-2 text-[10px] leading-4 text-[#a44c3a]">{policyFilesError}</p>}
        {policyFiles && <div className="mt-3 space-y-2">
          {policyFiles.length === 0
            ? <p className="rounded-[5px] bg-[#f7f8f4] px-3 py-3 text-[11px] text-[#687266]">No documents are attached to this policy.</p>
            : policyFiles.map(file => {
              const expired = expiredFileIds.has(file.id);
              const safeViewUrl = getSafeViewUrl(file.viewUrl);
              return <article key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[5px] border border-[#e8eae3] px-3 py-2.5">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-0.5 text-[#477e50]"><Icon name="file" size={15} /></span>
                  <div className="min-w-0">
                    <p className="break-all text-[11px] font-semibold text-[#354034]">{file.originalFilename}</p>
                    <p className="mt-1 text-[10px] text-[#788276]">
                      {file.purpose.replace(/_/g, " ").toLowerCase()} · {file.contentType} · {formatFileSize(file.fileSize)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#92988e]">Uploaded {formatUploadedAt(file.uploadedAt)}</p>
                  </div>
                </div>
                {expired
                  ? <span className="text-[10px] text-[#9e6041]">Link expired; refresh documents</span>
                  : !safeViewUrl
                    ? <span className="text-[10px] text-[#9e6041]">View link unavailable</span>
                  : <a
                    href={safeViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={event => {
                      const expiresAt = Date.parse(file.viewUrlExpiresAt);
                      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
                        event.preventDefault();
                        setExpiredFileIds(current => new Set(current).add(file.id));
                      }
                    }}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[5px] px-2.5 text-[10px] font-semibold text-[#477e50] hover:bg-[#f1f5ee]"
                  >
                    <Icon name="eye" size={13} />
                    View
                  </a>}
              </article>;
            })}
        </div>}
      </section>}
    </Modal>
  );
}

function getSafeViewUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
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
