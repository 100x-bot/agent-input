import React, { useEffect, useState, useRef } from "react";
import { Check, Sparkles, Box, Brain } from "lucide-react";
import { useAgentInput } from "../context/AgentInputProvider";
import type { LLMModel, ModelSelectionConfig } from "../types";
import { useDropdownNavigation } from "../hooks/useDropdownNavigation";

interface ModelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onModelSelect?: (modelId: string) => void;
}

const ModelSelectorDropdown: React.FC<ModelSelectorProps> = ({
  isOpen,
  onClose,
  onModelSelect,
}) => {
  const { sendMessage } = useAgentInput();
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    selectedIndex,
    handleKeyDown,
    setSelectedIndex
  } = useDropdownNavigation({
    itemsLength: models.length,
    onSelect: (index) => {
      if (models[index]) {
        handleModelChange(models[index].id);
      }
    },
    onClose,
    isOpen
  });

  useEffect(() => {
    if (isOpen && models.length === 0) {
      loadModels();
    }
  }, [isOpen]);

  useEffect(() => {
    loadSelectedModel();
  }, []);

  // Set initial selected index based on selectedModel when opened or models loaded
  useEffect(() => {
    if (isOpen && models.length > 0 && selectedModel) {
      const index = models.findIndex(m => m.id === selectedModel);
      if (index >= 0) {
        setSelectedIndex(index);
      } else {
        setSelectedIndex(0);
      }
    } else if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen, models, selectedModel, setSelectedIndex]);

  // Focus container on open
  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isOpen]);

  const loadSelectedModel = async () => {
    try {
      const response = await sendMessage({
        type: "daptin",
        method: "getSelectedModelId",
      });

      if (response.success) {
        setSelectedModel(response.data);
      } else {
        setSelectedModel("claude-haiku-4-5-20251001"); // Fallback
      }
    } catch (error) {
      setSelectedModel("claude-haiku-4-5-20251001"); // Fallback
    }
  };

  const loadModels = async (forceRefresh: boolean = false) => {
    try {
      setIsLoadingModels(true);

      const response = await sendMessage({
        type: "daptin",
        method: "fetchAvailableModels",
        forceRefresh: forceRefresh,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch models");
      }

      const availableModels: LLMModel[] = response.data || [];
      // Filter out Claude/Anthropic models from vertex provider and portkey models
      const filteredModels = availableModels.filter((model: LLMModel) => {
        const isVertex =
          model.provider?.toLowerCase()?.includes("vertex") ||
          model.id.includes("vertex");
        const isClaude =
          model.id.toLowerCase().includes("claude") ||
          model.name?.toLowerCase().includes("claude") ||
          model.id.toLowerCase().includes("anthropic");
        const isPortkey =
          model.provider?.toLowerCase()?.includes("portkey") ||
          model.id.toLowerCase().includes("portkey");

        if (isVertex && isClaude) {
          return false;
        }

        if (isPortkey) {
          return false;
        }

        return true;
      });
      setModels(filteredModels);
    } catch (err) {
      // silently handle error
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleModelChange = async (modelId: string) => {
    try {
      setSelectedModel(modelId);
      const config: ModelSelectionConfig = {
        selectedModel: modelId,
        lastFetched: Date.now(),
        fallbackModel: "claude-haiku-4-5-20251001",
      };

      const response = await sendMessage({
        type: "daptin",
        method: "saveModelConfig",
        config: config,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to save model config");
      }

      if (onModelSelect) {
        onModelSelect(modelId);
      }
      onClose();
    } catch (err) {
      // silently handle error
    }
  };

  const getModelIcon = (model: LLMModel) => {
    const name = model.name?.toLowerCase() || model.id.toLowerCase();
    const provider = model.provider?.toLowerCase() || "";

    if (name.includes("claude") || provider.includes("anthropic")) {
      return <Brain className="w-[1.25rem] h-[1.25rem]" style={{ color: 'var(--ai-text-secondary)' }} strokeWidth={2} />;
    }
    if (name.includes("gemini") || provider.includes("google")) {
      return <Sparkles className="w-[1.25rem] h-[1.25rem]" style={{ color: 'var(--ai-text-secondary)' }} strokeWidth={2} />;
    }
    if (name.includes("gpt") || provider.includes("openai")) {
      return <Box className="w-[1.25rem] h-[1.25rem]" style={{ color: 'var(--ai-text-secondary)' }} strokeWidth={2} />;
    }
    return <Box className="w-[1.25rem] h-[1.25rem]" style={{ color: 'var(--ai-text-secondary)' }} strokeWidth={2} />;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for outside click */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute bottom-full left-1/2 -translate-x-[20%] mb-2 z-50 w-[280px]">
        <div
          ref={containerRef}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          role="listbox"
          aria-label="Select model"
          className="rounded-[0.75rem] p-[0.75rem] flex flex-col gap-[0.25rem] overflow-hidden outline-none"
          style={{
            backgroundColor: 'var(--ai-surface-primary)',
            border: '1px solid var(--ai-border-default)',
            boxShadow: 'var(--ai-shadow-sm)',
          }}
        >
          {/* List container */}
          <div
            className="overflow-y-auto max-h-[300px]"
            style={{ scrollbarWidth: "none" }}
          >
            {isLoadingModels ? (
              <div className="flex items-center justify-center py-4">
                <div
                  className="animate-spin h-5 w-5 rounded-full"
                  style={{
                    border: '2px solid var(--ai-border-default)',
                    borderTopColor: 'var(--ai-status-working)',
                  }}
                />
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[0.875rem]" style={{ color: 'var(--ai-text-muted)' }}>
                  No models available
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[0.25rem]">
                {models.map((model, index) => {
                  const isSelected = model.id === selectedModel;
                  const isFocused = selectedIndex === index;

                  return (
                    <button
                      key={model.id}
                      role="option"
                      aria-selected={isSelected}
                      ref={isFocused ? (el) => {
                        if (el) {
                          el.scrollIntoView({ block: 'nearest' });
                        }
                      } : null}
                      onClick={() => handleModelChange(model.id)}
                      className="w-full flex items-center justify-between px-[0.5rem] h-[2.5rem] rounded-[0.5rem] transition-colors text-left group"
                      style={{
                        backgroundColor: isFocused || isSelected
                          ? 'var(--ai-surface-tertiary)'
                          : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!isFocused && !isSelected) {
                          e.currentTarget.style.backgroundColor = 'var(--ai-surface-secondary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isFocused && !isSelected) {
                          e.currentTarget.style.backgroundColor = '';
                        }
                      }}
                    >
                      <div className="flex items-center gap-[0.5rem] min-w-0 flex-1">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {getModelIcon(model)}
                        </div>
                        {/* Name */}
                        <span
                          className={`text-[0.875rem] truncate ${isSelected || isFocused ? "font-[500]" : "font-[400]"}`}
                          style={{
                            color: isSelected || isFocused
                              ? 'var(--ai-text-primary)'
                              : 'var(--ai-text-tertiary)',
                          }}
                        >
                          {model.name || model.id}
                        </span>
                      </div>

                      {isSelected && (
                        <Check className="w-[1rem] h-[1rem] flex-shrink-0 ml-2" style={{ color: 'var(--ai-status-working)' }} strokeWidth={2.5} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModelSelectorDropdown;
