"use client";

import type { MouseEvent } from "react";
import { LABEL_PALETTE, labelById, memberById } from "../../lib/trello/data";
import type { CardData, Member, ThemeColors } from "../../lib/trello/types";

interface CardModalProps {
  theme: ThemeColors;
  card: CardData;
  listTitle: string;
  roster: Member[];
  locked: boolean;
  labelPickerOpen: boolean;
  memberPickerOpen: boolean;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onDescChange: (value: string) => void;
  onToggleLabelPicker: () => void;
  onToggleMemberPicker: () => void;
  onToggleLabel: (labelId: string) => void;
  onToggleMember: (memberId: string) => void;
  onToggleChecklistItem: (index: number) => void;
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onAddComment: () => void;
}

export default function CardModal({
  theme,
  card,
  listTitle,
  roster,
  locked,
  labelPickerOpen,
  memberPickerOpen,
  onClose,
  onTitleChange,
  onDescChange,
  onToggleLabelPicker,
  onToggleMemberPicker,
  onToggleLabel,
  onToggleMember,
  onToggleChecklistItem,
  newComment,
  onNewCommentChange,
  onAddComment,
}: CardModalProps) {
  const stopProp = (e: MouseEvent) => e.stopPropagation();
  const labels = card.labelIds.map(labelById).filter((l): l is NonNullable<typeof l> => Boolean(l));
  const members = card.memberIds.map((id) => memberById(roster, id)).filter((m): m is Member => Boolean(m));
  const done = card.checklist.filter((i) => i.done).length;
  const total = card.checklist.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(20,20,25,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto", zIndex: 50 }}
    >
      <div onClick={stopProp} style={{ width: 640, maxWidth: "100%", background: theme.panelBg, color: theme.text, borderRadius: 12, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.3)" }}>
        {locked && (
          <div style={{ margin: "16px 24px 0", padding: "8px 12px", fontSize: 12.5, fontWeight: 700, color: "#92400E", background: "#FEF3C7", borderRadius: 7 }}>
            🔒 This board is locked — card editing is disabled.
          </div>
        )}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>in list {listTitle}</div>
            <textarea
              value={card.title}
              onChange={(e) => onTitleChange(e.target.value)}
              readOnly={locked}
              style={{ width: "100%", fontSize: 19, fontWeight: 800, border: "none", resize: "none", fontFamily: "inherit", padding: "2px 4px", borderRadius: 6, background: "transparent", color: theme.text }}
            />
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, border: "none", background: theme.subtleBg, borderRadius: 7, cursor: "pointer", color: theme.textSecondary, fontSize: 15, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* labels */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Labels</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {labels.map((lab) => (
                <div key={lab.id} style={{ padding: "5px 10px", borderRadius: 5, background: lab.color, color: "#fff", fontSize: 11.5, fontWeight: 700 }}>
                  {lab.name}
                </div>
              ))}
              {!locked && (
                <button
                  onClick={onToggleLabelPicker}
                  style={{ width: 26, height: 26, border: `1px solid ${theme.border}`, background: theme.panelBg, borderRadius: 6, cursor: "pointer", color: theme.textSecondary, fontSize: 13 }}
                >
                  +
                </button>
              )}
            </div>
            {!locked && labelPickerOpen && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, padding: 10, background: theme.subtleBg, borderRadius: 8, border: `1px solid ${theme.border}` }}>
                {LABEL_PALETTE.map((lc) => {
                  const active = labels.some((sl) => sl.id === lc.id);
                  return (
                    <div
                      key={lc.id}
                      onClick={() => onToggleLabel(lc.id)}
                      style={{ padding: "5px 10px", borderRadius: 5, background: lc.color, color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer", opacity: active ? 1 : 0.35 }}
                    >
                      {lc.name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* members */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Members</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {members.map((m) => (
                <div
                  key={m.id}
                  style={{ width: 30, height: 30, borderRadius: "50%", background: m.color, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {m.initials}
                </div>
              ))}
              {!locked && (
                <button
                  onClick={onToggleMemberPicker}
                  style={{ width: 30, height: 30, border: `1px solid ${theme.border}`, background: theme.panelBg, borderRadius: "50%", cursor: "pointer", color: theme.textSecondary, fontSize: 13 }}
                >
                  +
                </button>
              )}
            </div>
            {!locked && memberPickerOpen && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, padding: 10, background: theme.subtleBg, borderRadius: 8, border: `1px solid ${theme.border}` }}>
                {roster.map((mc) => {
                  const active = members.some((sm) => sm.id === mc.id);
                  return (
                    <div
                      key={mc.id}
                      onClick={() => onToggleMember(mc.id)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 5px", borderRadius: 20, background: theme.panelBg, border: `1px solid ${theme.border}`, cursor: "pointer", opacity: active ? 1 : 0.4 }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: mc.color, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {mc.initials}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{mc.name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* due date */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Due date</div>
            <div style={{ fontSize: 13, fontWeight: 600, background: theme.subtleBg, display: "inline-block", padding: "7px 12px", borderRadius: 7 }}>{card.due || "No due date"}</div>
          </div>

          {/* description */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Description</div>
            <textarea
              value={card.desc}
              onChange={(e) => onDescChange(e.target.value)}
              readOnly={locked}
              placeholder="Add a more detailed description…"
              style={{ width: "100%", minHeight: 70, padding: "10px 12px", border: `1px solid ${theme.border}`, borderRadius: 8, fontFamily: "inherit", fontSize: 13.5, resize: "vertical", lineHeight: 1.5, background: theme.inputBg, color: theme.text }}
            />
          </div>

          {/* checklist */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em" }}>Checklist</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.textSecondary }}>
                {done}/{total}
              </div>
            </div>
            <div style={{ height: 6, background: theme.subtleBg, borderRadius: 3, marginBottom: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#4F46E5", borderRadius: 3 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {card.checklist.map((item, i) => (
                <div key={i} onClick={() => !locked && onToggleChecklistItem(i)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 6px", borderRadius: 6, cursor: locked ? "default" : "pointer" }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `1.5px solid ${item.done ? "#4F46E5" : "#D8D4CB"}`,
                      background: item.done ? "#4F46E5" : "#fff",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 10,
                    }}
                  >
                    {item.done ? "✓" : ""}
                  </div>
                  <div style={{ fontSize: 13, color: item.done ? "#B3AFA6" : theme.text, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* comments */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Comments</div>
            {!locked && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  value={newComment}
                  onChange={(e) => onNewCommentChange(e.target.value)}
                  placeholder="Write a comment…"
                  style={{ flex: 1, padding: "9px 12px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 13, background: theme.inputBg, color: theme.text }}
                />
                <button
                  onClick={onAddComment}
                  style={{ padding: "9px 16px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                >
                  Send
                </button>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {card.comments.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <div
                    style={{ width: 26, height: 26, borderRadius: "50%", background: c.color, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    {c.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                      {c.author} <span style={{ fontWeight: 500, color: "#B3AFA6" }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: theme.text, marginTop: 2 }}>{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
