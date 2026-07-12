import { useEffect, useState } from "react";

import SearchBar from "../components/dashboard/SearchBar";
import EmployeeCard from "../components/dashboard/EmployeeCard";

import { getUsers } from "../services/userService";
import ProfileDrawer from "../components/dashboard/ProfileDrawer";
import { useNavigate } from "react-router-dom";
import socket  from "../hooks/useSocket";

export default function Users() {

  const [users, setUsers] = useState([]);
  const [search,setSearch]=useState("");
  const [department,setDepartment]=useState("");
  const [status,setStatus]=useState("");
  const [selectedUser,setSelectedUser]=useState(null);
  const navigate=useNavigate();

  useEffect(() => {
    loadUsers();
    socket.on("status-updated", () => {
  loadUsers();
});

return () => {
  socket.off("status-updated");
};
  }, []);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const filtered = users
.filter(user =>
(user.fullName || user.username)
.toLowerCase()
.includes(search.toLowerCase())
)
.filter(user =>
department ? user.department===department : true
)
.filter(user =>
status ? user.status===status : true
)
.sort((a,b)=>
(a.fullName || a.username)
.localeCompare(b.fullName || b.username)
);

  return (
    <div className="min-h-screen bg-slate-950 p-8">

      <h1 className="text-4xl font-bold text-cyan-400 mb-6">
        Enterprise Directory
      </h1>
     <SearchBar
search={search}
setSearch={setSearch}
department={department}
setDepartment={setDepartment}
status={status}
setStatus={setStatus}
/>

<h2 className="text-white mb-4 text-lg">
Total Employees : {filtered.length}
</h2>
     
      <div className="grid gap-5">

        {filtered.map((user) => (
          <EmployeeCard
key={user._id}
user={user}
onClick={()=>setSelectedUser(user)}
/>


        ))}

        <ProfileDrawer

user={selectedUser}

onClose={()=>setSelectedUser(null)}

onMessage={(user)=>{

navigate("/chat",{

state:{

user

}

});

}}

/>

      </div>

    </div>
  );
}