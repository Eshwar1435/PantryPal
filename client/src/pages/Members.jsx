import { useEffect, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import {
  getPantryMembers,
  addPantryMember,
  removePantryMember,
} from "../services/pantryApi.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

export default function Members() {
  const { id: pantryId } = useParams();
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [pendingMember, setPendingMember] = useState(null);

  const authenticatedUserId = String(user?.id || user?._id || "");

  const currentMember = members.find(
    (member) => String(member.id) === authenticatedUserId
  );

  const isOwner = currentMember?.role === "Owner";

  // Load members from the backend.
  const loadMembers = async () => {
    if (!pantryId) {
      setPageError("Pantry ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError("");

    try {
      const response = await getPantryMembers(pantryId);

      const memberList = Array.isArray(response)
        ? response
        : Array.isArray(response?.members)
          ? response.members
          : [];

      setMembers(memberList);
    } catch (error) {
      setPageError(error.message || "Unable to load pantry members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [pantryId]);

  // Add an existing registered PantryPal user.
  const handleAddMember = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setFormError("Please enter a registered email address.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccess("");
    setPageError("");

    try {
      await addPantryMember(pantryId, email.trim().toLowerCase());

      setEmail("");
      setShowAddModal(false);
      setSuccess("Member added successfully.");

      await loadMembers();
    } catch (error) {
      setFormError(error.message || "Unable to add member.");
    } finally {
      setSubmitting(false);
    }
  };

  // Remove a member from this pantry only.
  const handleRemoveMember = async (member) => {
    setPendingMember(member);
  };

  const confirmRemoveMember = async () => {
    if (!pendingMember || submitting || removing) return;

    setPageError("");
    setSuccess("");
    setRemoving(true);

    try {
      await removePantryMember(pantryId, pendingMember.id);

      setMembers((previous) =>
        previous.filter(
          (existingMember) =>
            String(existingMember.id) !== String(pendingMember.id)
        )
      );

      setSuccess(`${pendingMember.name} was removed from this pantry.`);
      setPendingMember(null);
    } catch (error) {
      setPageError(error.message || "Unable to remove member.");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="page members-page">
        <h1>Members</h1>
        <div className="empty-state">
          <p>Loading pantry members...</p>
        </div>
      </div>
    );
  }

  if (pageError && members.length === 0) {
    return (
      <div className="page members-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Shared access</p>
            <h1>Members</h1>
            <p>Manage access to this pantry.</p>
          </div>
        </div>

        <div className="form-error">{pageError}</div>

        <button className="btn" type="button" onClick={loadMembers}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="page members-page owner-page-members">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Shared access</p>
          <h1>Members</h1>
          <p>Manage access to this pantry.</p>
        </div>

        {isOwner && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              setFormError("");
              setEmail("");
              setShowAddModal(true);
            }}
          >
            <Plus size={18} />
            Add member
          </button>
        )}
      </div>

      {pageError && <div className="form-error">{pageError}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="members-count">
        <Users size={19} />
        <span>
          <strong>{members.length}</strong>{" "}
          {members.length === 1 ? "member" : "members"} in this pantry
        </span>
      </div>

      <div className="members-grid">
        {members.map((member) => (
          <article className="member-card" key={member.id}>
            <div className="member-avatar">
              {member.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U"}
            </div>

            <div className="member-info">
              <h2>{member.name}</h2>
              <p>{member.email}</p>

              <span className={`role ${member.role.toLowerCase()}`}>
                {member.role}
              </span>
            </div>

            {isOwner && member.role !== "Owner" && (
              <button
                type="button"
                className="icon-button danger"
                onClick={() => handleRemoveMember(member)}
                aria-label={`Remove ${member.name} from pantry`}
                title="Remove member"
              >
                <Trash2 size={18} />
              </button>
            )}
          </article>
        ))}

        {members.length === 0 && (
          <div className="empty-state">
            <Users size={32} />
            <h3>No members yet</h3>
            <p>
              {isOwner
                ? "Add registered PantryPal users to share this pantry."
                : "There are no members to display."}
            </p>
          </div>
        )}
      </div>

      {/* Add member modal */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setShowAddModal(false);
            }
          }}
        >
          <form className="modal small-modal" onSubmit={handleAddMember}>
            <div className="modal-heading">
              <div>
                <h2>Add member</h2>
                <p>
                  Enter the email address of an existing PantryPal user.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
                aria-label="Close add member dialog"
              >
                ×
              </button>
            </div>

            <div className="form-grid single">
              <label>
                Registered email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="person@example.com"
                  required
                  disabled={submitting}
                />
              </label>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>

              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? "Adding..." : "Add member"}
              </button>
            </div>
          </form>
        </div>
      )}
      <ConfirmDialog open={Boolean(pendingMember)} title="Remove pantry member?" itemName={pendingMember?.name || ""} message="This member will lose access to this pantry." confirmLabel="Remove" busy={removing} onCancel={() => !removing && setPendingMember(null)} onConfirm={confirmRemoveMember} />
    </div>
  );
}