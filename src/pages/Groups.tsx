import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { useGroup } from '../hooks/useGroup';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../config/constants';

interface User {
  _id: string;
  name: string;
  email: string;
}

const Groups: React.FC = () => {
  const { groups, fetchGroups, createGroup } = useGroup();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Filter groups based on search term
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Search for users by name or email
  const handleUserSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const res = await axios.get(`${API_URL}/api/users/search?query=${query}`);
      setSearchResults(res.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };
  
  // Add user to selected list
  const handleAddUser = (user: User) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchTerm('');
      setSearchResults([]);
    }
  };
  
  // Remove user from selected list
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };
  
  // Handle create group form submission
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast.error('Please add at least one member to the group');
      return;
    }
    
    setIsCreating(true);
    
    try {
      await createGroup(
        newGroupName,
        selectedUsers.map(user => user._id)
      );
      
      toast.success('Group created successfully!');
      setShowCreateModal(false);
      setNewGroupName('');
      setSelectedUsers([]);
      fetchGroups();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create group';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Groups</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-5 w-5 mr-1" />
          Create a group
        </button>
      </div>
      
      {/* Search bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
      </div>
      
      {/* Groups list */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map(group => (
            <Link
              key={group._id}
              to={`/groups/${group._id}`}
              className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-medium text-lg">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-800">{group.name}</h3>
                    <p className="text-sm text-gray-500">
                      {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-primary-600 hover:text-primary-700">
                  <Users className="h-4 w-4 mr-1" />
                  <span>View group details</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No groups found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {groups.length === 0
              ? "You haven't created any groups yet."
              : "No groups match your search criteria."}
          </p>
          {groups.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-5 w-5 mr-1" />
              Create your first group
            </button>
          )}
        </div>
      )}
      
      {/* Create group modal */}
      {showCreateModal && (
        <div className="fixed z-20 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create a new group
                  </h3>
                  <div className="mt-6">
                    <form onSubmit={handleCreateGroup}>
                      <div>
                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                          Group name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id="groupName"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Enter group name"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label htmlFor="members" className="block text-sm font-medium text-gray-700">
                          Add members
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type="text"
                            id="members"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              handleUserSearch(e.target.value);
                            }}
                            placeholder="Search by name or email"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          />
                          
                          {searchResults.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 overflow-auto max-h-56">
                              {searchResults.map(user => (
                                <div
                                  key={user._id}
                                  onClick={() => handleAddUser(user)}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedUsers.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected members:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(user => (
                              <div 
                                key={user._id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-primary-100 text-primary-800"
                              >
                                {user.name}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUser(user._id)}
                                  className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary-400 hover:text-primary-500 focus:outline-none"
                                >
                                  <span className="sr-only">Remove {user.name}</span>
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          disabled={isCreating}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-500 text-base font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCreating ? 'Creating...' : 'Create Group'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;