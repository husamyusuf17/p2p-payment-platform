import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { walletAPI, transactionAPI } from "../services/api";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState("0.00");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        walletAPI.getBalance(),
        transactionAPI.getHistory(),
      ]);

      setBalance(balanceRes.data.balance);
      setTransactions(transactionsRes.data.transactions.slice(0, 5)); // Latest 5
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.welcomeText}>Welcome back, {user?.full_name}!</h1>
          <p style={styles.emailText}>{user?.email}</p>
        </div>
        <button onClick={logout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* Balance Card */}
      <div style={styles.balanceCard}>
        <div style={styles.balanceLabel}>Total Balance</div>
        <div style={styles.balanceAmount}>${balance}</div>
        <div style={styles.quickActions}>
          <button
            onClick={() => navigate("/send-money")}
            style={{ ...styles.actionButton, ...styles.sendButton }}
          >
            💸 Send Money
          </button>
          <button
            onClick={() => navigate("/deposit")}
            style={{ ...styles.actionButton, ...styles.depositButton }}
          >
            ➕ Deposit
          </button>
          <button
            onClick={() => navigate("/withdraw")}
            style={{ ...styles.actionButton, ...styles.withdrawButton }}
          >
            ➖ Withdraw
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={styles.transactionsSection}>
        <h2 style={styles.sectionTitle}>Recent Transactions</h2>

        {transactions.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No transactions yet</p>
            <p style={{ fontSize: "14px", color: "#999", marginTop: "8px" }}>
              Start by depositing money or sending to friends!
            </p>
          </div>
        ) : (
          <div style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <div key={transaction.id} style={styles.transactionItem}>
                <div style={styles.transactionIcon}>
                  {transaction.direction === "sent" ? "📤" : "📥"}
                </div>
                <div style={styles.transactionDetails}>
                  <div style={styles.transactionTitle}>
                    {transaction.transaction_type === "deposit" &&
                      "Wallet Deposit"}
                    {transaction.transaction_type === "withdrawal" &&
                      "Wallet Withdrawal"}
                    {transaction.transaction_type === "transfer" &&
                      (transaction.direction === "sent"
                        ? `Sent to ${transaction.other_party.name}`
                        : `Received from ${transaction.other_party.name}`)}
                  </div>
                  <div style={styles.transactionDate}>
                    {new Date(transaction.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </div>
                </div>
                <div
                  style={{
                    ...styles.transactionAmount,
                    color:
                      transaction.direction === "received"
                        ? "#10b981"
                        : "#ef4444",
                  }}
                >
                  {transaction.direction === "received" ? "+" : "-"}$
                  {transaction.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  spinner: {
    color: "white",
    fontSize: "20px",
    fontWeight: "600",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px",
  },
  welcomeText: {
    color: "white",
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0",
  },
  emailText: {
    color: "rgba(255,255,255,0.8)",
    margin: "8px 0 0 0",
  },
  logoutButton: {
    padding: "10px 24px",
    background: "rgba(255,255,255,0.2)",
    border: "2px solid white",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s",
  },
  balanceCard: {
    background: "white",
    borderRadius: "20px",
    padding: "40px",
    marginBottom: "30px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
  },
  balanceLabel: {
    color: "#666",
    fontSize: "14px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "8px",
  },
  balanceAmount: {
    fontSize: "48px",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "30px",
  },
  quickActions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
  },
  actionButton: {
    padding: "16px",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    color: "white",
  },
  sendButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  depositButton: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  withdrawButton: {
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  },
  transactionsSection: {
    background: "white",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "20px",
    marginTop: "0",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#666",
  },
  transactionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  transactionItem: {
    display: "flex",
    alignItems: "center",
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "12px",
    gap: "16px",
    transition: "background 0.2s",
  },
  transactionIcon: {
    fontSize: "28px",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "white",
    borderRadius: "12px",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontWeight: "600",
    color: "#333",
    marginBottom: "4px",
  },
  transactionDate: {
    fontSize: "13px",
    color: "#999",
  },
  transactionAmount: {
    fontSize: "18px",
    fontWeight: "bold",
  },
};

export default Dashboard;
