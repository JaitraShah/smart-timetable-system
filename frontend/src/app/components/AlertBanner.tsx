import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface AlertBannerProps {
  type: 'error' | 'success' | 'warning';
  message: string;
}

export function AlertBanner({ type, message }: AlertBannerProps) {
  const styles = {
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: XCircle,
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertCircle,
    },
  };

  const Icon = styles[type].icon;

  return (
    <div className={`${styles[type].bg} border rounded-lg p-4 flex items-start gap-3`}>
      <Icon size={20} className={styles[type].text} />
      <p className={`${styles[type].text} text-sm`}>{message}</p>
    </div>
  );
}
