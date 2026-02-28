import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { walletAPI } from "../services/api";

function Deposit() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await walletAPI.deposit(parseFloat(amount));
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>Deposit Successful!</h2>
          <p style={styles.successText}>${amount} added to your wallet</p>
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

        <h1 style={styles.title}>Deposit Money</h1>
        <p style={styles.subtitle}>Add funds to your wallet</p>

        <form onSubmit={handleSubmit} style={styles.form}>
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
              autoFocus
            />
          </div>

          <div style={styles.infoBox}>
            💡 <strong>Tip:</strong> In a real app, this would connect to a
            payment gateway like Stripe or PayPal.
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Processing..." : `Deposit $${amount || "0.00"}`}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
    color: "#10b981",
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
    fontSize: "24px",
    textAlign: "center",
    outline: "none",
    fontWeight: "bold",
  },
  infoBox: {
    background: "#f0f9ff",
    border: "2px solid #0ea5e9",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "14px",
    color: "#0369a1",
  },
  button: {
    padding: "14px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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

export default Deposit;
