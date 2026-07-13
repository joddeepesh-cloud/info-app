import { IoSearchOutline, IoFilterOutline, IoSwapVerticalOutline } from "react-icons/io5";

export default function SearchBar({
  search,
  setSearch,
  department,
  setDepartment,
  status,
  setStatus,
  sortBy,
  setSortBy
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-stretch">
      
      {/* 1. Keyword search (Flex-1) */}
      <div className="relative flex-1">
        <IoSearchOutline className="absolute left-3 top-3 text-slate-500" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by colleague name..."
          className="w-full bg-slate-950 border border-slate-850 p-2.5 pl-10 rounded-xl text-xs focus:outline-none focus:border-cyan-500/50 text-slate-200 transition"
        />
      </div>

      {/* 2. Dropdown Filter and Sorting controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        
        {/* Department Selector */}
        <div className="relative min-w-[150px]">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-slate-350 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
          >
            <option value="">All Departments</option>
            <option value="Development">Development</option>
            <option value="HR">HR</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
          </select>
          <IoFilterOutline className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" size={14} />
        </div>

        {/* Status Selector */}
        <div className="relative min-w-[140px]">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-slate-355 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Online">Online</option>
            <option value="Away">Away</option>
            <option value="Busy">Busy</option>
            <option value="Offline">Offline</option>
          </select>
          <IoFilterOutline className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" size={14} />
        </div>

        {/* Sorting Dropdown */}
        <div className="relative min-w-[150px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-slate-355 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
          >
            <option value="name">Sort: A-Z Name</option>
            <option value="nameDesc">Sort: Z-A Name</option>
            <option value="status">Sort: Online First</option>
          </select>
          <IoSwapVerticalOutline className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" size={14} />
        </div>

      </div>

    </div>
  );
}