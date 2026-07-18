"use client";

import { useState, type MouseEvent } from "react";
import { AlignLeft, Check, CheckSquare, ClipboardList, Clock, Lock, MessageCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { LABEL_PALETTE, findCard, labelById, memberById } from "../../lib/trello/data";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useBoards } from "../../lib/trello/contexts/BoardsContext";
import { useNavigation } from "../../lib/trello/contexts/NavigationContext";
import type { Member } from "../../lib/trello/types";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

export default function CardModal() {
  const { theme } = useTheme();
  const { roster, currentUser } = useAuth();
  const { boards, updateCard, patchCardDebounced, deleteCard } = useBoards();
  const { activeBoardId, selectedCardId, selectedListId, closeCard } = useNavigation();

  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newComment, setNewComment] = useState("");
  const [confirmingDeleteCard, setConfirmingDeleteCard] = useState(false);
  const [editingCommentIndex, setEditingCommentIndex] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

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

  const startEditComment = (idx: number) => {
    setEditingCommentIndex(idx);
    setEditingCommentText(card.comments[idx].text);
  };

  const cancelEditComment = () => {
    setEditingCommentIndex(null);
    setEditingCommentText("");
  };

  const saveEditComment = () => {
    if (editingCommentIndex === null) return;
    const text = editingCommentText.trim();
    if (!text) return;
    const comments = card.comments.map((c, i) => (i !== editingCommentIndex ? c : { ...c, text }));
    updateCard(board.id, card.id, { comments });
    cancelEditComment();
  };

  const deleteComment = (idx: number) => {
    const comments = card.comments.filter((_, i) => i !== idx);
    updateCard(board.id, card.id, { comments });
  };

  const handleDeleteCard = () => setConfirmingDeleteCard(true);
  const confirmDeleteCard = () => {
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
  const isOverdue = !!dueValue && dueValue < new Date().toISOString().slice(0, 10);
  const overdueText = "#E11D48";
  const overdueBg = "rgba(225,29,72,0.12)";
  const doneColor = "#16A34A";

  const sectionLabelStyle = { fontSize: 10.5, fontWeight: 700, color: theme.textSecondary, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 6 };
  const iconBtnStyle = { width: 30, height: 30, border: "none", background: theme.subtleBg, borderRadius: 7, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div
      onClick={closeCard}
      style={{ position: "fixed", inset: 0, background: "rgba(20,20,25,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "56px 20px", overflowY: "auto", zIndex: 50 }}
    >
      <div onClick={stopProp} style={{ width: 720, maxWidth: "100%", background: theme.panelBg, color: theme.text, borderRadius: 10, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "20px 24px 4px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <ClipboardList size={19} style={{ color: theme.textSecondary, flexShrink: 0, marginTop: 2 }} />
            <textarea
              value={card.title}
              onChange={(e) => patchCardDebounced(board.id, card.id, { title: e.target.value })}
              readOnly={locked}
              rows={1}
              style={{ width: "100%", fontSize: 18, fontWeight: 800, border: "none", resize: "none", fontFamily: "inherit", padding: "2px 4px", borderRadius: 6, background: "transparent", color: theme.text }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {!locked && (
              <button onClick={handleDeleteCard} title="Delete card" style={{ ...iconBtnStyle, color: "#E11D48" }}>
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={closeCard} title="Close" style={{ ...iconBtnStyle, color: theme.textSecondary }}>
              <X size={15} />
            </button>
          </div>
        </div>
        <div style={{ fontSize: 13, color: theme.textSecondary, padding: "0 24px 16px 53px" }}>
          in list <span style={{ textDecoration: "underline" }}>{listTitle}</span>
        </div>

        {locked && (
          <div style={{ margin: "0 24px 16px", padding: "7px 12px", fontSize: 12, fontWeight: 700, color: theme.warningText, background: theme.warningBg, border: `1px solid ${theme.warningBorder}`, borderRadius: 7, display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={13} /> This board is locked — card editing is disabled.
          </div>
        )}

        <ConfirmDeleteDialog
          open={confirmingDeleteCard}
          onOpenChange={setConfirmingDeleteCard}
          title="Delete this card?"
          description={`"${card.title}" will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete card"
          onConfirm={confirmDeleteCard}
        />

        <div style={{ padding: "0 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* labels */}
          <div>
            <div style={sectionLabelStyle}>Labels</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {labels.map((lab) => (
                <div key={lab.id} style={{ padding: "4px 12px", borderRadius: 4, background: lab.color, color: "#fff", fontSize: 12, fontWeight: 600 }}>
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
                      style={{ padding: "4px 12px", borderRadius: 4, background: lc.color, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: active ? 1 : 0.35 }}
                    >
                      {lc.name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* due date + members */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={sectionLabelStyle}>Due date</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: `1px solid ${isOverdue ? "transparent" : theme.border}`,
                  borderRadius: 7,
                  padding: "5px 10px",
                  background: isOverdue ? overdueBg : theme.subtleBg,
                }}
              >
                <Clock size={13} style={{ color: isOverdue ? overdueText : theme.textSecondary, flexShrink: 0 }} />
                <input
                  type="date"
                  value={dueValue}
                  onChange={(e) => patchCardDebounced(board.id, card.id, { due: e.target.value || null })}
                  disabled={locked}
                  style={{ fontSize: 12.5, fontWeight: 600, border: "none", background: "transparent", fontFamily: "inherit", color: isOverdue ? overdueText : theme.text, padding: 0 }}
                />
              </div>
            </div>

            <div style={{ flex: "1 1 160px" }}>
              <div style={sectionLabelStyle}>Members</div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                {members.map((m, i) => (
                  <div
                    key={m.id}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: m.color,
                      color: "#fff",
                      fontSize: 10.5,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: i === 0 ? 0 : -6,
                      border: `2px solid ${theme.panelBg}`,
                    }}
                  >
                    {m.initials}
                  </div>
                ))}
                {!locked && (
                  <button
                    onClick={toggleMemberPicker}
                    style={{ width: 26, height: 26, border: `1px solid ${theme.border}`, background: theme.panelBg, borderRadius: "50%", cursor: "pointer", color: theme.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: members.length ? 6 : 0 }}
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
          </div>

          {/* description */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <AlignLeft size={15} style={{ color: theme.textSecondary }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>Description</div>
            </div>
            <textarea
              value={card.desc}
              onChange={(e) => patchCardDebounced(board.id, card.id, { desc: e.target.value })}
              readOnly={locked}
              placeholder="Add a more detailed description…"
              style={{ width: "100%", minHeight: 64, padding: "10px 12px", border: `1px solid ${theme.border}`, borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", lineHeight: 1.5, background: theme.inputBg, color: theme.text }}
            />
          </div>

          {/* checklist */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckSquare size={15} style={{ color: theme.textSecondary }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>Checklist</div>
              </div>
              {total > 0 && <div style={{ fontSize: 11.5, fontWeight: 700, color: pct === 100 ? doneColor : theme.textSecondary }}>{done}/{total}</div>}
            </div>
            {total > 0 && (
              <div style={{ height: 6, background: theme.subtleBg, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? doneColor : theme.accent, borderRadius: 3 }} />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {card.checklist.map((item, i) => (
                <div
                  key={i}
                  onClick={() => !locked && toggleChecklistItem(i)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, background: theme.inputBg, border: `1px solid ${theme.border}`, cursor: locked ? "default" : "pointer" }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `1.5px solid ${item.done ? theme.accent : theme.border}`,
                      background: item.done ? theme.accent : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                    }}
                  >
                    {item.done && <Check size={11} />}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: item.done ? theme.textSecondary : theme.text, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</div>
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
                  style={{ padding: "8px 14px", background: theme.accent, color: "#fff", border: "none", borderRadius: 7, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* comments */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <MessageCircle size={15} style={{ color: theme.textSecondary }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>Comments</div>
            </div>
            {!locked && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: currentUser?.color ?? theme.accent, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {currentUser?.initials ?? "??"}
                </div>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addComment();
                    }
                  }}
                  placeholder="Write a comment…"
                  style={{ flex: 1, padding: "9px 12px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 13, background: theme.inputBg, color: theme.text }}
                />
                <button
                  onClick={addComment}
                  style={{ padding: "9px 16px", background: theme.accent, color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                >
                  Send
                </button>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {card.comments.map((c, i) => {
                const isOwn = !!currentUser && c.author === currentUser.name;
                const isEditing = editingCommentIndex === i;
                return (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: c.color, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {c.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                          {c.author} <span style={{ fontWeight: 500, color: theme.textSecondary }}>{c.time}</span>
                        </div>
                        {!locked && isOwn && !isEditing && (
                          <div style={{ display: "flex", gap: 2 }}>
                            <button
                              onClick={() => startEditComment(i)}
                              title="Edit comment"
                              style={{ width: 20, height: 20, border: "none", background: "transparent", borderRadius: 5, cursor: "pointer", color: theme.textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => deleteComment(i)}
                              title="Delete comment"
                              style={{ width: 20, height: 20, border: "none", background: "transparent", borderRadius: 5, cursor: "pointer", color: theme.textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            autoFocus
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEditComment();
                              } else if (e.key === "Escape") {
                                cancelEditComment();
                              }
                            }}
                            style={{ flex: 1, padding: "8px 10px", border: `1px solid ${theme.border}`, borderRadius: 6, fontFamily: "inherit", fontSize: 13, background: theme.inputBg, color: theme.text }}
                          />
                          <button
                            onClick={saveEditComment}
                            style={{ padding: "8px 12px", background: theme.accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditComment}
                            style={{ padding: "8px 12px", background: theme.subtleBg, color: theme.text, border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: theme.text, background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: 6, padding: "8px 10px" }}>{c.text}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
