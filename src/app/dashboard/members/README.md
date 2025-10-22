# Members Implementation

This directory contains the implementation of the members feature that loads actual members from the Firestore database instead of using mock data.

## Key Components

### `page.tsx`

The main page component that allows users to select a community and view its members. It includes:

- Community selection dropdown
- Empty state when no community is selected
- MembersDisplay component to show members of the selected community

### `[communityId]/page.tsx`

The community-specific members page that displays:

- List of actual members from the selected community
- Member search functionality
- Sorting options
- Member details including name, role, and contact information

### `MembersDisplay.tsx` (in src/components/dashboard)

A reusable component that:

- Queries users from Firestore
- Filters users who are members of the specified community
- Supports two different ways users might be associated with communities:
  1. Through a direct `communities` array field containing community IDs
  2. Through a `communityMemberships` array containing objects with community IDs
- Provides grid and list views for displaying members
- Includes search functionality

## Data Loading Pattern

The implementation follows these steps:

1. Query users with direct community association:
   ```typescript
   query(
     collection(firestore, 'users'),
     where('communities', 'array-contains', communityId)
   )
   ```

2. Query users with membership objects:
   ```typescript
   query(
     collection(firestore, 'users'),
     where('communityMemberships', 'array-contains', { community: communityId })
   )
   ```

3. Combine results from both queries to create a complete list of members

4. Extract membership details for each user, considering both association methods

## User Data Structure

The implementation supports two ways users can be associated with communities:

1. **Direct Association**:
   ```json
   {
     "id": "user123",
     "fullName": "John Doe",
     "communities": ["community1", "community2"]
   }
   ```

2. **Membership Objects**:
   ```json
   {
     "id": "user456",
     "fullName": "Jane Smith",
     "communityMemberships": [
       {
         "community": "community1",
         "role": "admin",
         "joinedAt": { "seconds": 1634567890 }
       }
     ]
   }
   ```

The implementation handles both structures to ensure all members are displayed correctly.
