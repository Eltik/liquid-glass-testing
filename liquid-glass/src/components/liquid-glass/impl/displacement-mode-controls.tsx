import { useState } from "react";

interface DisplacementModeControlsProps {
  mode: "standard" | "polar" | "prominent" | "shader";
  onModeChange: (mode: "standard" | "polar" | "prominent" | "shader") => void;
  displacementScale: number;
  onDisplacementScaleChange: (scale: number) => void;
  aberrationIntensity: number;
  onAberrationIntensityChange: (intensity: number) => void;
  elasticity: number;
  onElasticityChange: (elasticity: number) => void;
}

export default function DisplacementModeControls({
  mode,
  onModeChange,
  displacementScale,
  onDisplacementScaleChange,
  aberrationIntensity,
  onAberrationIntensityChange,
  elasticity,
  onElasticityChange,
}: DisplacementModeControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-[10001] max-w-xs rounded-lg bg-black/50 p-4 text-white backdrop-blur-sm">
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-semibold">Enhanced Controls</h3>
        <span className="text-sm">{isExpanded ? "−" : "+"}</span>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-4">
          {/* Displacement Mode */}
          <div>
            <label className="mb-2 block text-xs font-medium">
              Displacement Mode
            </label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { value: "standard", label: "Standard" },
                { value: "polar", label: "Polar" },
                { value: "prominent", label: "Prominent" },
                { value: "shader", label: "Shader" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onModeChange(
                      option.value as
                        | "standard"
                        | "polar"
                        | "prominent"
                        | "shader",
                    )
                  }
                  className={`rounded px-2 py-1 text-xs transition-all ${
                    mode === option.value
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Displacement Scale */}
          <div>
            <label className="mb-1 block text-xs font-medium">
              Displacement Scale: {displacementScale}
            </label>
            <input
              type="range"
              min="10"
              max="150"
              value={displacementScale}
              onChange={(e) =>
                onDisplacementScaleChange(parseInt(e.target.value))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20"
            />
          </div>

          {/* Aberration Intensity */}
          <div>
            <label className="mb-1 block text-xs font-medium">
              Aberration: {aberrationIntensity}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={aberrationIntensity}
              onChange={(e) =>
                onAberrationIntensityChange(parseFloat(e.target.value))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20"
            />
          </div>

          {/* Elasticity */}
          <div>
            <label className="mb-1 block text-xs font-medium">
              Elasticity: {elasticity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={elasticity}
              onChange={(e) => onElasticityChange(parseFloat(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20"
            />
          </div>

          <div className="mt-3 text-xs text-white/70">
            <p>
              <strong>Standard:</strong> Basic barrel distortion
            </p>
            <p>
              <strong>Polar:</strong> Radial swirl effect
            </p>
            <p>
              <strong>Prominent:</strong> Wave interference
            </p>
            <p>
              <strong>Shader:</strong> WebGL-generated patterns
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
