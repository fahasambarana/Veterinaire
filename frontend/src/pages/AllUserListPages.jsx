import React from 'react'
import UserListForAdmin from '../components/UserListForAdmin'
import LayoutSidebar from '../components/LayoutSidebar'

const AllUserListPages = () => {
  return (
    <LayoutSidebar>
      <UserListForAdmin />
    </LayoutSidebar>
  )
}

export default AllUserListPages