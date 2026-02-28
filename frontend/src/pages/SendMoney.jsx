import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { transactionAPI } from "../services/api";

function SendMoney() {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    const email = e.target.value;
    setSearchEmail(email);

    if (email.length >= 2) {
      try {
        const response = await transactionAPI.searchUsers(email);
        setSearchResults(response.data.users);
      } catch (err) {
        console.error("Search failed:", err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchEmail(user.email);
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await transactionAPI.send({
        receiver_email: selectedUser.email,
        amount: parseFloat(amount),
        description,
      });
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>Transfer Successful!</h2>
          <p style={styles.successText}>
            ${amount} sent to {selectedUser?.full_name}
          </p>
          <p style={styles.successSubtext}>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button
          onClick={() => navigate("/dashboard")}
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>

        <h1 style={styles.title}>Send Money</h1>
        <p style={styles.subtitle}>Transfer funds to another user</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Search for recipient */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Recipient Email</label>
            <input
              type="email"
              value={searchEmail}
              onChange={handleSearch}
              placeholder="Search by email..."
              required
              style={styles.input}
            />

            {searchResults.length > 0 && (
              <div style={styles.searchResults}>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => selectUser(user)}
                    style={styles.searchResultItem}
                  >
                    <div style={styles.userAvatar}>
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.userName}>{user.full_name}</div>
                      <div style={styles.userEmail}>{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedUser && (
            <>
              {/* Selected user display */}
              <div style={styles.selectedUser}>
                <div style={styles.userAvatar}>
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={styles.userName}>{selectedUser.full_name}</div>
                  <div style={styles.userEmail}>{selectedUser.email}</div>
                </div>
              </div>

              {/* Amount */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  style={styles.input}
                />
              </div>

              {/* Description */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this for?"
                  style={styles.input}
                />
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? "Sending..." : `Send $${amount || "0.00"}`}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "white",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    width: "100%",
    maxWidth: "500px",
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#667eea",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "20px",
    padding: "8px 0",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#666",
    marginBottom: "32px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "relative",
  },
  label: {
    fontWeight: "600",
    color: "#333",
    fontSize: "14px",
  },
  input: {
    padding: "12px 16px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "16px",
    outline: "none",
  },
  searchResults: {
    position: "absolute",
    top: "100%",
    left: "0",
    right: "0",
    background: "white",
    border: "2px solid #e0e0e0",
    borderTop: "none",
    borderRadius: "0 0 8px 8px",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 10,
  },
  searchResultItem: {
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  selectedUser: {
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "2px solid #667eea",
  },
  userAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
  },
  userName: {
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: "14px",
    color: "#666",
  },
  button: {
    padding: "14px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
  },
  error: {
    background: "#fee",
    color: "#c33",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    textAlign: "center",
  },
  successCard: {
    background: "white",
    padding: "60px 40px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    maxWidth: "400px",
  },
  successIcon: {
    fontSize: "64px",
    marginBottom: "20px",
  },
  successTitle: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: "12px",
  },
  successText: {
    fontSize: "18px",
    color: "#333",
    marginBottom: "8px",
  },
  successSubtext: {
    color: "#666",
    fontSize: "14px",
  },
};

export default SendMoney;
