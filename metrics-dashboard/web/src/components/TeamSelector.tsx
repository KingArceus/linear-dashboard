import type { Team } from "../types.js";

interface TeamSelectorProps {
  teams: Team[];
  value: string;
  onChange: (teamId: string) => void;
  disabled?: boolean;
}

export function TeamSelector({ teams, value, onChange, disabled }: TeamSelectorProps) {
  return (
    <div className="control">
      <label htmlFor="team-select">Team</label>
      <select
        id="team-select"
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
      >
        <option value="">Select a team</option>
        {teams.map(team => (
          <option key={team.id} value={team.id}>
            {team.name} ({team.key})
          </option>
        ))}
      </select>
    </div>
  );
}
