import React from "react";
import { Loader2 } from "lucide-react";
import { AgentStatus } from "../types";

export interface AgentStatusIndicatorProps {
  status: AgentStatus;
  viewErrorDetails: boolean;
  onViewErrorDetailsToggle: () => void;
}

const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({
  status,
  viewErrorDetails,
  onViewErrorDetailsToggle,
}) => {
  const getStatusColor = () => {
    switch (status.state) {
      case "working":
        return "#09A8F8";
      case "waiting_for_human":
        return "#00AEEF";
      case "error":
        return "#FF4C4C";
      default:
        return "#09A8F8";
    }
  };

  const getPingColor = () => {
    switch (status.state) {
      case "working":
        return "#CAEBFB";
      case "waiting_for_human":
        return "#ADD8E6";
      case "error":
        return "#FF6B6B";
      default:
        return "#CAEBFB";
    }
  };

  const getStatusText = () => {
    switch (status.state) {
      case "working":
        return status.operation || "Agent is working...";
      case "waiting_for_human":
        return "Agent is waiting...";
      case "error":
        return "Agent encountered an error";
      default:
        return "Ready";
    }
  };

  return (
    <div className="flex items-center justify-between gap-[0.5rem] overflow-hidden">
      {/* Left side: Status icon and text */}
      <div className="flex items-center gap-[0.5rem] flex-1 min-w-0">
        {/* Spinning loader icon - only show when agent is active */}
        {status.state === "working" ? (
          <div className="relative flex items-center justify-center w-[1rem] h-[1rem] flex-shrink-0">
            <Loader2
              className="w-[1rem] h-[1rem] text-[#3870FF] animate-spin"
              strokeWidth={2.5}
            />
          </div>
        ) : status.state === "error" ? (
          <div className="relative flex items-center w-[0.75rem] h-[0.75rem] flex-shrink-0">
            <div className="w-[0.5rem] h-[0.5rem] rounded-full bg-[#FF4C4C]" />
          </div>
        ) : (
          <div className="relative flex items-center w-[0.75rem] h-[0.75rem] flex-shrink-0">
            <div className="w-[0.5rem] h-[0.5rem] rounded-full bg-[#22c55e]" />
          </div>
        )}

        {/* Status text */}
        <span
          className={`text-[0.75rem] font-dm-sans font-[500] truncate ${status.state === "working" ? "text-[#3870FF]" :
            status.state === "error" ? "text-[#FF4C4C]" :
              "text-[#22c55e]"
            }`}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Right side: Tool tag badge */}
      {status.state === "working" && status.currentTool && (
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-[0.5rem] py-[0.125rem] rounded-[0.25rem] bg-[#f1f5f9] text-[0.625rem] font-dm-mono font-[500] text-[#64748b]">
            {status.currentTool}
          </span>
        </div>
      )}

      {/* View Details button for errors */}
      {status.state === "error" && status.error && (
        <button
          onClick={onViewErrorDetailsToggle}
          className="flex-shrink-0 flex items-center gap-[0.25rem] cursor-pointer text-[0.75rem] font-[500] text-[#64748b] hover:text-[#334155] transition-colors"
        >
          View Details
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-[1rem] h-[1rem] transition-transform ${viewErrorDetails ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
};

export default AgentStatusIndicator;
