interface ModeSwitcherProps {
  onModeChange: (mode: "original" | "enhanced") => void;
  currentMode: "original" | "enhanced";
}

export default function ModeSwitcher({
  onModeChange,
  currentMode,
}: ModeSwitcherProps) {
  return (
    <div className="fixed top-20 right-4 z-[10001] rounded-lg bg-black/50 p-4 text-white backdrop-blur-sm">
      <h3 className="mb-3 text-sm font-semibold">Implementation Mode</h3>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center space-x-2">
          <input
            type="radio"
            name="mode"
            value="original"
            checked={currentMode === "original"}
            onChange={() => onModeChange("original")}
            className="h-4 w-4 accent-blue-500"
          />
          <span className="text-sm">Original</span>
        </label>
        <label className="flex cursor-pointer items-center space-x-2">
          <input
            type="radio"
            name="mode"
            value="enhanced"
            checked={currentMode === "enhanced"}
            onChange={() => onModeChange("enhanced")}
            className="h-4 w-4 accent-blue-500"
          />
          <span className="text-sm">Enhanced</span>
        </label>
      </div>

      <div className="mt-3 text-xs text-white/70">
        <p className="mb-1">
          <strong>Original:</strong> Basic glass effect with drag & resize
        </p>
        <p>
          <strong>Enhanced:</strong> Advanced features from example 2:
        </p>
        <ul className="mt-1 ml-2 space-y-0.5">
          <li>• Multi-mode displacement maps</li>
          <li>• Chromatic aberration</li>
          <li>• Elastic mouse interaction</li>
          <li>• Dynamic borders & effects</li>
        </ul>
      </div>
    </div>
  );
}
