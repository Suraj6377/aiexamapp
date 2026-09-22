"use client";

import React, { useEffect, useState, useRef } from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { AIProviderConfig } from "@/types/paper";
import {
  Cpu,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Server,
  Zap,
  Globe,
  RefreshCw,
  Search,
  Check,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface ModelInfo {
  id: string;
  name: string;
  contextLength?: number;
  promptPrice?: string | null;
  completionPrice?: string | null;
  description?: string;
}

const OPENROUTER_RECOMMENDED = [
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", tag: "Smartest" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", tag: "Fast & Economical" },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1", tag: "Reasoning" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", tag: "Open Source" },
  { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", tag: "Ultra Fast" },
  { id: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B", tag: "Multilingual" },
];

const GEMINI_RECOMMENDED = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", tag: "Next-Gen (Fastest)" },
  { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite", tag: "Ultra Low Latency" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", tag: "Complex Reasoning" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", tag: "Standard Stable" },
];

export default function AISettingsPage() {
  const { success, error, info } = useToast();

  const [configs, setConfigs] = useState<AIProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Dynamic Models State
  const [modelsByProvider, setModelsByProvider] = useState<Record<string, ModelInfo[]>>({});
  const [fetchingModelsId, setFetchingModelsId] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState<Record<string, string>>({});
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    async function loadConfigs() {
      try {
        const res = await fetch("/api/ai/config");
        const data = await res.json();
        const loadedConfigs: AIProviderConfig[] = data.configs || [];
        setConfigs(loadedConfigs);

        // Preload OpenRouter models if OpenRouter provider exists
        const openrouterCfg = loadedConfigs.find((c) => c.provider === "openrouter");
        if (openrouterCfg) {
          fetchModelsForProvider(openrouterCfg, openrouterCfg.apiKey);
        }
      } catch (err) {
        error("Failed to load AI configurations");
      } finally {
        setLoading(false);
      }
    }
    loadConfigs();
  }, []);

  const fetchModelsForProvider = async (config: AIProviderConfig, apiKeyToUse?: string) => {
    const key = apiKeyToUse !== undefined ? apiKeyToUse : config.apiKey;
    // For providers other than OpenRouter, don't fetch if no API key
    if (!key && config.provider !== "openrouter" && config.provider !== "custom") {
      return;
    }

    setFetchingModelsId(config.id);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: key,
          baseUrl: config.baseUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.models)) {
        setModelsByProvider((prev) => ({
          ...prev,
          [config.id]: data.models,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch models for provider", config.provider, err);
    } finally {
      setFetchingModelsId(null);
    }
  };

  const updateConfigField = (id: string, updates: Partial<AIProviderConfig>) => {
    setConfigs((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      return next;
    });

    // If API Key changed, debounce model fetching so user sees models dynamically
    if ("apiKey" in updates) {
      const newApiKey = updates.apiKey;
      const targetConfig = configs.find((c) => c.id === id);
      if (targetConfig) {
        if (debounceTimers.current[id]) {
          clearTimeout(debounceTimers.current[id]);
        }
        debounceTimers.current[id] = setTimeout(() => {
          fetchModelsForProvider(targetConfig, newApiKey);
        }, 600);
      }
    }
  };

  const handleTestConnection = async (config: AIProviderConfig) => {
    setTestingId(config.id);
    try {
      info(`Testing connection to ${config.name}...`, "Connection Test");
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        }),
      });

      const result = await res.json();
      setTestResults((prev) => ({ ...prev, [config.id]: result }));

      if (result.success) {
        success(result.message, `${config.name} Active`);
        // Refresh models with verified key
        fetchModelsForProvider(config);
      } else {
        error(result.message, `${config.name} Verification Failed`);
      }
    } catch (err: any) {
      error(err.message || "Failed to reach provider endpoint");
    } finally {
      setTestingId(null);
    }
  };

  const handleSaveConfig = async (config: AIProviderConfig) => {
    setSavingId(config.id);
    try {
      const res = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error("Failed to save configuration");
      success(`${config.name} configuration saved securely!`, "Settings Updated");
    } catch (err: any) {
      error(err.message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "openrouter":
        return <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "groq":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "gemini":
        return <Sparkles className="w-4 h-4 text-blue-500" />;
      case "custom":
        return <Server className="w-4 h-4 text-sky-500" />;
      default:
        return <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopHeader
        title="AI Provider Settings"
        subtitle="Configure API credentials, OpenRouter multi-model integration, and dynamic model routing"
      />

      <div className="flex-1 p-3 sm:p-6 max-w-5xl w-full mx-auto space-y-5 sm:space-y-6">
        {/* Security & Grounding Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-purple-500/10 dark:from-indigo-950/30 dark:to-slate-900 border border-indigo-200/60 dark:border-indigo-900/40 flex items-start gap-3 sm:gap-4">
          <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Zero Client-Side Exposure & Grounded Local Engine
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              All AI API keys and model prompts execute strictly server-side. Connect your OpenRouter or Gemini/OpenAI credentials to access hundreds of premier frontier LLMs, or use the built-in local grounded engine with zero API keys required.
            </p>
          </div>
        </div>

        {/* Providers List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading AI providers...</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {configs.map((config) => {
              const isTesting = testingId === config.id;
              const isSaving = savingId === config.id;
              const testResult = testResults[config.id];
              const availableModels = modelsByProvider[config.id] || [];
              const isFetchingModels = fetchingModelsId === config.id;
              const isDropdownOpen = dropdownOpenId === config.id;
              const searchQuery = modelSearch[config.id] || "";

              // Filter models based on search query
              const filteredModels = availableModels.filter(
                (m) =>
                  m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.name.toLowerCase().includes(searchQuery.toLowerCase())
              );

              return (
                <div
                  key={config.id}
                  className={`rounded-3xl bg-white dark:bg-slate-900 border transition-all p-4 sm:p-6 space-y-4 sm:space-y-5 ${
                    config.isActive
                      ? "border-indigo-500/80 shadow-md ring-1 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 shadow-sm"
                  }`}
                >
                  {/* Provider Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center">
                        {getProviderIcon(config.provider)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {config.name}
                          </h3>
                          {config.isDefault && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              DEFAULT
                            </span>
                          )}
                          {config.provider === "openrouter" && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              300+ LLMs
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {config.provider === "openrouter"
                            ? "Unified API Gateway for Claude, GPT-4o, Llama 3, DeepSeek R1 & more"
                            : `${config.provider.toUpperCase()} Direct Engine Integration`}
                        </p>
                      </div>
                    </div>

                    {/* Active Toggle & External Link */}
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      {config.provider === "openrouter" && (
                        <a
                          href="https://openrouter.ai/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          <span>Get API Key</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Enable Provider</span>
                        <input
                          type="checkbox"
                          checked={config.isActive}
                          onChange={(e) => updateConfigField(config.id, { isActive: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* API Key */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-slate-400" />
                          <span>API Key</span>
                        </label>
                        {config.provider === "openrouter" && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Starts with sk-or-v1-...
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          value={config.apiKey}
                          onChange={(e) => updateConfigField(config.id, { apiKey: e.target.value })}
                          onBlur={() => fetchModelsForProvider(config)}
                          placeholder={`Enter your ${config.name} API Key...`}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[42px]"
                        />
                      </div>
                    </div>

                    {/* Model Name & Interactive Combobox */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-slate-400" />
                          <span>Active Model</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {availableModels.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                              {availableModels.length} models ready
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => fetchModelsForProvider(config)}
                            disabled={isFetchingModels}
                            title="Refresh available models from provider"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isFetchingModels ? "animate-spin" : ""}`} />
                            <span>{isFetchingModels ? "Loading..." : "Refresh"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Model Input with Dropdown trigger */}
                      <div className="relative">
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={config.model}
                            onChange={(e) => updateConfigField(config.id, { model: e.target.value })}
                            onFocus={() => {
                              if (availableModels.length > 0) setDropdownOpenId(config.id);
                            }}
                            placeholder="e.g. anthropic/claude-3.5-sonnet"
                            className="w-full px-3 py-2.5 pr-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[42px]"
                          />
                          <button
                            type="button"
                            onClick={() => setDropdownOpenId(isDropdownOpen ? null : config.id)}
                            className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            title="Toggle model list"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        {/* Searchable Models Dropdown */}
                        {isDropdownOpen && availableModels.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-72 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* Search bar inside dropdown */}
                            <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setModelSearch((prev) => ({ ...prev, [config.id]: e.target.value }))}
                                placeholder="Search models (e.g. claude, gpt, llama, deepseek)..."
                                className="w-full text-xs bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
                                autoFocus
                              />
                            </div>

                            {/* Models List */}
                            <div className="overflow-y-auto p-1.5 space-y-1">
                              {filteredModels.length === 0 ? (
                                <p className="p-3 text-xs text-slate-400 text-center">No matching models found</p>
                              ) : (
                                filteredModels.slice(0, 50).map((m) => {
                                  const isSelected = config.model === m.id;
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => {
                                        updateConfigField(config.id, { model: m.id });
                                        setDropdownOpenId(null);
                                      }}
                                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition min-h-[38px] ${
                                        isSelected
                                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      <div className="truncate mr-2">
                                        <div className="font-mono text-[11px] truncate">{m.id}</div>
                                        {m.name && m.name !== m.id && (
                                          <div className="text-[10px] text-slate-400 truncate">{m.name}</div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {m.contextLength ? (
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                                            {Math.round(m.contextLength / 1000)}k ctx
                                          </span>
                                        ) : null}
                                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                              {filteredModels.length > 50 && (
                                <p className="text-[10px] text-slate-400 text-center py-1">
                                  Showing top 50 matches. Type to refine search.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Model Recommendation Pills for OpenRouter */}
                    {config.provider === "openrouter" && (
                      <div className="md:col-span-2 pt-1">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>Popular OpenRouter Models (Click to select):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {OPENROUTER_RECOMMENDED.map((rec) => {
                            const isSelected = config.model === rec.id;
                            return (
                              <button
                                key={rec.id}
                                type="button"
                                onClick={() => updateConfigField(config.id, { model: rec.id })}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition flex items-center gap-1.5 border min-h-[32px] ${
                                  isSelected
                                    ? "bg-purple-100 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 font-bold shadow-xs"
                                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                <span>{rec.label}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                                  {rec.tag}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Model Recommendation Pills for Google Gemini */}
                    {config.provider === "gemini" && (
                      <div className="md:col-span-2 pt-1">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          <span>Gemini 2.0 & Premier Models (Click to select):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {GEMINI_RECOMMENDED.map((rec) => {
                            const isSelected = config.model === rec.id;
                            return (
                              <button
                                key={rec.id}
                                type="button"
                                onClick={() => updateConfigField(config.id, { model: rec.id })}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition flex items-center gap-1.5 border min-h-[32px] ${
                                  isSelected
                                    ? "bg-blue-100 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 font-bold shadow-xs"
                                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                <span>{rec.label}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                                  {rec.tag}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Base URL (if custom or OpenAI-compatible) */}
                    {(config.provider === "custom" || config.provider === "openrouter" || config.baseUrl) && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Base URL Endpoint
                        </label>
                        <input
                          type="text"
                          value={config.baseUrl || ""}
                          onChange={(e) => updateConfigField(config.id, { baseUrl: e.target.value })}
                          placeholder="https://openrouter.ai/api/v1 or http://localhost:11434/v1"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[42px]"
                        />
                      </div>
                    )}

                    {/* Temperature Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        <span>Temperature</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{config.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={config.temperature}
                        onChange={(e) => updateConfigField(config.id, { temperature: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Max Tokens */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        <span>Max Output Tokens</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{config.maxTokens}</span>
                      </div>
                      <input
                        type="range"
                        min={1024}
                        max={8192}
                        step={512}
                        value={config.maxTokens}
                        onChange={(e) => updateConfigField(config.id, { maxTokens: parseInt(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Test Connection Feedback */}
                  {testResult && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 transition-all ${
                        testResult.success
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-medium">{testResult.message}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleTestConnection(config)}
                      disabled={isTesting}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition active:scale-98 disabled:opacity-50 min-h-[44px]"
                    >
                      {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                      <span>{isTesting ? "Testing Key & Endpoint..." : "Test Key & Connection"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveConfig(config)}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-98 disabled:opacity-50 min-h-[44px]"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Save Configuration</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
