interface StatusBadgeProps {
  status: "approved" | "rejected" | "pending";
}

const config = {
  approved: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", dot: "#22c55e", label: "Approved" },
  rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", dot: "#ef4444", label: "Rejected" },
  pending:  { bg: "#fffbeb", color: "#d97706", border: "#fde68a", dot: "#f59e0b", label: "Pending"  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.dot,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
}
