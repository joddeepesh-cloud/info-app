export default function SearchBar({
  search,
  setSearch,
 department,
  setDepartment,
  status,
  setStatus,
}) {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6">

      <input
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        placeholder="🔍 Search employee..."
        className="bg-slate-800 p-3 rounded-xl text-white"
      />

      <select
        value={department}
        onChange={(e)=>setDepartment(e.target.value)}
        className="bg-slate-800 p-3 rounded-xl text-white"
      >
        <option value="">All Departments</option>
        <option>Development</option>
        <option>HR</option>
        <option>Marketing</option>
        <option>Finance</option>
      </select>

      <select
        value={status}
        onChange={(e)=>setStatus(e.target.value)}
        className="bg-slate-800 p-3 rounded-xl text-white"
      >
        <option value="">All Status</option>
        <option>Online</option>
        <option>Busy</option>
        <option>Offline</option>
      </select>

    </div>
  );
}