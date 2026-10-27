import { activity } from '../data/mockData.js';

// Read-only table of recent inventory changes.
export default function Activity() {
  return (
    <>
      <h1>Activity</h1>
      <div className="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Item</th><th>Change</th><th>Note</th><th>Time</th></tr></thead>
          <tbody>
            {activity.map((a) => (
              <tr key={a.id}>
                <td>{a.user}</td>
                <td>{a.item}</td>
                <td className={a.changeAmount < 0 ? 'neg' : 'pos'}>{a.changeAmount > 0 ? '+' : ''}{a.changeAmount}</td>
                <td>{a.note}</td>
                <td>{a.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
