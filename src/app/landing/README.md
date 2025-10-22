# Community Inbox Implementation

This directory contains the implementation of a community inbox feature based on the mongo-nextjs inbox implementation. The feature allows users to:

1. Select a community from a dropdown
2. View a list of users who have sent or received messages in that community
3. View the conversation with a selected user

## Key Components

### `page.tsx`

The main page component that implements the community inbox UI. It includes:

- Community selection dropdown
- User list with latest message preview
- Conversation view with message history

### `landing.module.scss`

SASS styles for the landing page, using CSS variables for theming instead of Tailwind classes.

### `layout.tsx`

Simple layout component that wraps the page with the Firebase client provider.

## Data Flow

1. **Community Loading**:
   - Queries the Firestore 'communities' collection
   - Displays communities in a dropdown
   - Auto-selects the first community if none is selected

2. **User Loading**:
   - When a community is selected, queries messages related to that community
   - Identifies users who have sent or received messages in the community
   - Displays users in a sidebar list with their latest message

3. **Message Loading**:
   - When a user is selected, filters messages to show only those related to the selected user
   - Sorts messages chronologically
   - Displays messages in a conversation view with appropriate styling for sent vs received messages

## Integration

The Community Inbox is accessible from:

1. The home page via a direct link
2. The dashboard sidebar navigation

## Styling Notes

- Uses SASS modules instead of Tailwind CSS
- Implements responsive design for mobile and desktop views
- Uses CSS variables for theming consistency
