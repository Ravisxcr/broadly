"use client";

import { useState, type MouseEvent } from "react";
import { Check, Lock, Plus, Trash2, X } from "lucide-react";
import { LABEL_PALETTE, findCard, labelById, memberById } from "../../lib/trello/data";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useBoards } from "../../lib/trello/contexts/BoardsContext";
import { useNavigation } from "../../lib/trello/contexts/NavigationContext";
import type { Member } from "../../lib/trello/types";

export default function CardModal() {
  const { theme } = useTheme();
  const { roster, currentUser } = useAuth();
  const { boards, updateCard, patchCardDebounced, deleteCard } = useBoards();
  const { activeBoardId, selectedCardId, selectedListId, closeCard } = useNavigation();

  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newComment, setNewComment] = useState("");

  const board = boards.find((b) => b.id === activeBoardId) ?? null;
  const card = activeBoardId && selectedCardId ? findCard(boards, activeBoardId, selectedCardId) : null;
  const listTitle = board?.lists.find((l) => l.id === selectedListId)?.title ?? "";
  const locked = !!board?.locked;

  if (!board || !card) return null;

  const toggleLabelPicker = () => {
    setLabelPickerOpen((v) => !v);
    setMemberPickerOpen(false);
  };
  const toggleMemberPicker = () => {
    setMemberPickerOpen((v) => !v);
    setLabelPickerOpen(false);
  };

  const toggleLabel = (labelId: string) => {
    const labelIds = card.labelIds.includes(labelId) ? card.labelIds.filter((id) => id !== labelId) : [...card.labelIds, labelId];
    updateCard(board.id, card.id, { labelIds });
  };

  const toggleMember = (memberId: string) => {
    const memberIds = card.memberIds.includes(memberId) ? card.memberIds.filter((id) => id !== memberId) : [...card.memberIds, memberId];
    updateCard(board.id, card.id, { memberIds });
  };

  const toggleChecklistItem = (idx: number) => {
    const checklist = card.checklist.map((item, i) => (i !== idx ? item : { ...item, done: !item.done }));
    updateCard(board.id, card.id, { checklist });
  };

  const deleteChecklistItem = (idx: number) => {
    const checklist = card.checklist.filter((_, i) => i !== idx);
    updateCard(board.id, card.id, { checklist });
  };

  const addChecklistItem = () => {
    const text = newChecklistItem.trim();
    if (!text) return;
    const checklist = [...card.checklist, { text, done: false }];
    setNewChecklistItem("");
    updateCard(board.id, card.id, { checklist });
  };

  const addComment = () => {
    const text = newComment.trim();
    if (!text) return;
    const comments = [
      ...card.comments,
      { author: currentUser?.name ?? "Someone", initials: currentUser?.initials ?? "??", color: currentUser?.color ?? "#4F46E5", time: "just now", text },
    ];
    setNewComment("");
    updateCard(board.id, card.id, { comments });
  };

  const handleDeleteCard = () => {
    if (!window.confirm("Delete this card? This can't be undone.")) return;
    deleteCard(board.id, card.id);
    closeCard();
  };

  const stopProp = (e: MouseEvent) => e.stopPropagation();
  const labels = card.labelIds.map(labelById).filter((l): l is NonNullable<typeof l> => Boolean(l));
  const members = card.memberIds.map((id) => memberById(roster, id)).filter((m): m is Member => Boolean(m));
  const done = card.checklist.filter((i) => i.done).length;
  const total = card.checklist.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const dueValue = card.due && /^\d{4}-\d{2}-\d{2}$/.test(card.due) ? card.due : "";
  const sectionLabelStyle = { fontSize: 10.5, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 6 };

  return (
    <div
      onClick={closeCard}
      style={{ position: "fixed", inset: 0, background: "rgba(20,20,25,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "36px 20px", overflowY: "auto", zIndex: 50 }}
    >
      <div onClick={stopProp} style={{ width: 600, maxWidth: "100%", background: theme.panelBg, color: theme.text, borderRadius: 12, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.3)" }}>
        {locked && (
          <div style={{ margin: "12px 20px 0", padding: "7px 12px", fontSize: 12, fontWeight: 700, color: "#92400E", background: "#FEF3C7", borderRadius: 7, display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={13} /> This board is locked — card editing is disabled.
          </div>
        )}
        <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>in list {listTitle}</div>
            <textarea
              value={card.title}
              onChange={(e) => patchCardDebounced(board.id, card.id, { title: e.target.value })}
              readOnly={locked}
              rows={1}
              style={{ width: "100%", fontSize: 17, fontWeight: 800, border: "none", resize: "none", fontFamily: "inherit", padding: "2px 4px", borderRadius: 6, background: "transparent", color: theme.text }}
            />
          </div>
          {!locked && (
            <button
              onClick={handleDeleteCard}
              title="Delete card"
              style={{ width: 28, height: 28, border: "none", background: theme.subtleBg, borderRadius: 7, cursor: "pointer", color: "#E11D48", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={closeCard}
            style={{ width: 28, height: 28, border: "none", background: theme.subtleBg, borderRadius: 7, cursor: "pointer", color: theme.textSecondary, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: "12px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* labels + members + due date */}
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {/* labels */}
            <div style={{ flex: "1 1 160px" }}>
              <div style={sectionLabelStyle}>Labels</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {labels.map((lab) => (
                  <div key={lab.id} style={{ padding: "4px 9px", borderRadius: 5, background: lab.color, color: "#fff", fontSize: 11, fontWeight: 700 }}>
                    {lab.name}
                  </div>
                ))}
                {!locked && (
                  <button
                    onClick={toggleLabelPicker}
                    style={{ width: 24, height: 24, border: `1px solid ${theme.border}`, background: theme.panelBg, borderRadius: 6, cursor: "pointer", color: theme.textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {labelPickerOpen ? <X size={12} /> : <Plus size={12} />}
                  </button>
                )}
              </div>
              {!locked && labelPickerOpen && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6, padding: 8, background: theme.subtleBg, borderRadius: 8, border: `1px solid ${theme.border}` }}>
                  {LABEL_PALETTE.map((lc) => {
                    const active = labels.some((sl) => sl.id === lc.id);
                    return (
                      <div
                        key={lc.id}
                        onClick={() => toggleLabel(lc.id)}
                        style={{ padding: "4px 9px", borderRadius: 5, background: lc.color, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: active ? 1 : 0.35 }}
                      >
                        {lc.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* members */}
            <div style={{ flex: "1 1 160px" }}>
              <div style={sectionLabelStyle}>Members</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {members.map((m) => (
                  <div
                    key={m.id}
                    style={{ width: 26, height: 26, borderRadius: "50%", background: m.color, color: "#fff", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {m.initials}
                  </div>
                ))}
                {!locked && (
                  <button
                    onClick={toggleMemberPicker}
                    style={{ width: 26, height: 26, border: `1px solid ${theme.border}`, background: theme.panelBg, borderRadius: "50%", cursor: "pointer", color: theme.textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {memberPickerOpen ? <X size={13} /> : <Plus size={13} />}
                  </button>
                )}
              </div>
              {!locked && memberPickerOpen && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6, padding: 8, background: theme.subtleBg, borderRadius: 8, border: `1px solid ${theme.border}` }}>
                  {roster.map((mc) => {
                    const active = members.some((sm) => sm.id === mc.id);
                    return (
                      <div
                        key={mc.id}
                        onClick={() => toggleMember(mc.id)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 9px 4px 4px", borderRadius: 20, background: theme.panelBg, border: `1px solid ${theme.border}`, cursor: "pointer", opacity: active ? 1 : 0.4 }}
                      >
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: mc.color, color: "#fff", fontSize: 8.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {mc.initials}
                        </div>
                        <div style={{ fontSize: 11.5, fontWeight: 600 }}>{mc.name}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* due date */}
            <div style={{ flex: "1 1 140px" }}>
              <div style={sectionLabelStyle}>Due date</div>
              <input
                type="date"
                value={dueValue}
                onChange={(e) => patchCardDebounced(board.id, card.id, { due: e.target.value || null })}
                disabled={locked}
                style={{ fontSize: 12.5, fontWeight: 600, background: theme.subtleBg, border: `1px solid ${theme.border}`, padding: "6px 10px", borderRadius: 7, fontFamily: "inherit", color: theme.text }}
              />
            </div>
          </div>

          {/* description */}
          <div>
            <div style={sectionLabelStyle}>Description</div>
            <textarea
              value={card.desc}
              onChange={(e) => patchCardDebounced(board.id, card.id, { desc: e.target.value })}
              readOnly={locked}
              placeholder="Add a more detailed description…"
              style={{ width: "100%", minHeight: 56, padding: "8px 10px", border: `1px solid ${theme.border}`, borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", lineHeight: 1.45, background: theme.inputBg, color: theme.text }}
            />
          </div>

          {/* checklist */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={sectionLabelStyle}>Checklist</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.textSecondary }}>
                {done}/{total}
              </div>
            </div>
            <div style={{ height: 5, background: theme.subtleBg, borderRadius: 3, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#4F46E5", borderRadius: 3 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {card.checklist.map((item, i) => (
                <div key={i} onClick={() => !locked && toggleChecklistItem(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 6, cursor: locked ? "default" : "pointer" }}>
                  <div
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: 4,
                      border: `1.5px solid ${item.done ? "#4F46E5" : "#D8D4CB"}`,
                      background: item.done ? "#4F46E5" : "#fff",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                    }}
                  >
                    {item.done && <Check size={10} />}
                  </div>
                  <div style={{ flex: 1, fontSize: 12.5, color: item.done ? "#B3AFA6" : theme.text, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</div>
                  {!locked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChecklistItem(i);
                      }}
                      style={{ width: 20, height: 20, border: "none", background: "transparent", borderRadius: 5, cursor: "pointer", color: theme.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!locked && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChecklistItem();
                    }
                  }}
                  placeholder="Add an item…"
                  style={{ flex: 1, padding: "8px 10px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 12.5, background: theme.inputBg, color: theme.text }}
                />
                <button
                  onClick={addChecklistItem}
                  style={{ padding: "8px 14px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 7, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* comments */}
          <div>
            <div style={sectionLabelStyle}>Comments</div>
            {!locked && (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  style={{ flex: 1, padding: "9px 12px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 13, background: theme.inputBg, color: theme.text }}
                />
                <button
                  onClick={addComment}
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
