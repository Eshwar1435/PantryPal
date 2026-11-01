
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Boxes, Package, Plus, Trash2, TriangleAlert, Users } from "lucide-react";
import { deletePantry, listPantries, createPantry } from "../services/pantryApi.js";
import { getPantryItems } from "../services/inventoryApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import { usePantry } from "../context/PantryContext.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { subscribeRealtime } from "../services/realtime.js";

export default function PantryList() {
  const { user } = useAuth();
  const { refreshPantries } = usePantry();
  const navigate = useNavigate();

  const [pantries, setPantries] = useState([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [summary, setSummary] = useState({});
  const [success, setSuccess] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pantryRevision, setPantryRevision] = useState(0);

  const loadPantries = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listPantries();
      setPantries(data);
      const entries = await Promise.all(data.map(async pantry => {
        try {
          const items = await getPantryItems(pantry.id);
          return [pantry.id, {
            itemCount: items.length,
            lowStockCount: items.filter(item => item.quantity <= item.lowStockThreshold).length,
          }];
        } catch {
          return [pantry.id, { itemCount: 0, lowStockCount: 0 }];
        }
      }));
      setSummary(Object.fromEntries(entries));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const removePantry = async pantry => {
    setPendingDelete(pantry);
  };

  const confirmRemovePantry = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(pendingDelete.id);
    setError("");
    setSuccess("");
    try {
      await deletePantry(pendingDelete.id);
      await refreshPantries();
      await loadPantries();
      setSuccess(`"${pendingDelete.name}" was deleted successfully.`);
      setPendingDelete(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeleting("");
    }
  };

  useEffect(() => {
    loadPantries();
  }, [pantryRevision]);

  useEffect(() => {
    const events = [
      'pantry:member-added',
      'pantry:member-removed',
      'pantry:ownership-transferred',
      'pantry:deleted',
      'inventory:item-added',
      'inventory:item-updated',
      'inventory:item-deleted',
      'inventory:quantity-updated',
      'realtime:status',
    ];
    const cleanups = events.map(event => subscribeRealtime(event, () => {
      setPantryRevision(previous => previous + 1);
    }));
    return () => cleanups.forEach(cleanup => cleanup());
  }, []);

  const create = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Pantry name is required.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      await createPantry(name.trim());
      setName("");
      setModal(false);
      await refreshPantries();
      await loadPantries();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>My Pantries</h1>
          <p>Organize groceries and supplies across shared spaces.</p>
        </div>

        <button
          className="btn"
          onClick={() => {
            setError("");
            setSuccess("");
            setModal(true);
          }}
        >
          <Plus size={18} /> Create pantry
        </button>
      </div>

      {error && !modal && <div className="form-error">{error}</div>}
      {success && !modal && <div className="form-success">{success}</div>}

      {loading ? (
        <div className="empty-state">
          <p>Loading pantries...</p>
        </div>
      ) : (
        <div className="pantry-grid">
          {pantries.map((pantry, index) => {
            const isOwner =
              String(pantry.ownerId) === String(user?.id || user?._id);

            const pantrySummary = summary[pantry.id] || { itemCount: 0, lowStockCount: 0 };
            const openWorkspace = event => {
              if (event.target.closest('a,button')) return;
              navigate(`/pantries/${pantry.id}`);
            };
            const handleKeyDown = event => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(`/pantries/${pantry.id}`);
              }
            };
            return (
              <article className="pantry-card pantry-card-clickable" key={pantry.id} role="link" tabIndex="0" onClick={openWorkspace} onKeyDown={handleKeyDown} aria-label={`Open ${pantry.name} workspace`}>
                <div className={`pantry-cover cover-${index % 3}`}>
                  <span>
                    <Boxes size={28} />
                  </span>
                </div>

                <div className="pantry-card-body">
                  <div className="pantry-title">
                    <div>
                      <h2>{pantry.name}</h2>
                      <span className={`role ${isOwner ? "owner" : "member"}`}>{isOwner ? "Owner" : "Member"}</span>
                    </div>
                    <ArrowUpRight size={20} />
                  </div>

                  <p className="pantry-context">{isOwner ? "Your managed pantry" : "A pantry shared with you"}</p>
                  <div className="pantry-metrics">
                    <span><Users size={16} /><strong>{pantry.memberIds?.length || 0}</strong> members</span>
                    <span><Package size={16} /><strong>{pantrySummary.itemCount}</strong> items</span>
                    <span><TriangleAlert size={16} /><strong>{pantrySummary.lowStockCount}</strong> low</span>
                  </div>
                  <div className="pantry-card-actions">
                    {isOwner && <button type="button" className="pantry-delete-button" onClick={event => { event.stopPropagation(); removePantry(pantry); }} disabled={deleting === pantry.id} aria-label={`Delete ${pantry.name}`}><Trash2 size={17}/><span>{deleting === pantry.id ? "Deleting..." : "Delete Pantry"}</span></button>}
                  </div>
                </div>
              </article>
            );
          })}

          {!pantries.length && !error && (
            <div className="empty-state">
              <p>No pantries yet. Create one to get started.</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) =>
            !creating &&
            event.target === event.currentTarget &&
            setModal(false)
          }
        >
          <form className="modal small-modal" onSubmit={create}>
            <div className="modal-heading">
              <div>
                <h2>Create a pantry</h2>
                <p>Add a new shared space.</p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(false)}
                disabled={creating}
              >
                ×
              </button>
            </div>

            <label>
              Pantry name
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Office Kitchen"
                disabled={creating}
              />
            </label>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setModal(false)}
                disabled={creating}
              >
                Cancel
              </button>

              <button className="btn" disabled={creating}>
                {creating ? "Creating..." : "Create pantry"}
              </button>
            </div>
          </form>
        </div>
      )}
      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete pantry?" itemName={pendingDelete?.name || ""} message="This removes its inventory and activity history. All members will lose access." busy={Boolean(deleting)} onCancel={() => !deleting && setPendingDelete(null)} onConfirm={confirmRemovePantry} />
    </div>
  );
}
