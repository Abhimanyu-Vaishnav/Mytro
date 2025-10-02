import React, { useState, useEffect } from 'react';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    // API call to fetch user data
    fetchUserData();
    fetchUserPosts();
    fetchFollowCounts();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch('/api/user/posts');
      const postsData = await response.json();
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const followersResponse = await fetch('/api/user/followers/count');
      const followingResponse = await fetch('/api/user/following/count');
      
      const followers = await followersResponse.json();
      const following = await followingResponse.json();
      
      setFollowersCount(followers.count);
      setFollowingCount(following.count);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image">
          <img src={user.profileImage || '/default-avatar.png'} alt="Profile" />
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{user.name || 'User Name'}</h1>
          <p className="profile-username">@{user.username}</p>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-number">{posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat">
              <span className="stat-number">{followersCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat">
              <span className="stat-number">{followingCount}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;