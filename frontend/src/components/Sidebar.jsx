function Sidebar() {
  return (
    <div className="w-64 h-screen p-4" style={{ background: 'var(--color-sidebar)', color: 'var(--color-text)' }}>
      <h2 className="text-xl font-bold mb-4">Menu</h2>
      <ul>
        <li><a href="/admin" className="block py-2 hover:bg-gray-200" style={{ color: 'var(--color-text)' }}>Dashboard</a></li>
        <li><a href="/items" className="block py-2 hover:bg-gray-200" style={{ color: 'var(--color-text)' }}>Items</a></li>
        <li><a href="/profile" className="block py-2 hover:bg-gray-200" style={{ color: 'var(--color-text)' }}>Profile</a></li>
      </ul>
    </div>
  );
}

export default Sidebar;


// Sidebar jsx 