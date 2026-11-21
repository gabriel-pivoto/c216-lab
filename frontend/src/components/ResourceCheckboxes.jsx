import { ROOM_RESOURCES } from "../utils/labels.js";

export default function ResourceCheckboxes({ selected, onChange }) {
  function toggle(resource) {
    onChange(
      selected.includes(resource)
        ? selected.filter((item) => item !== resource)
        : [...selected, resource],
    );
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="field-label">Recursos</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(ROOM_RESOURCES).map(([value, label]) => (
          <label key={value} className="flex items-center gap-1.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => toggle(value)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
