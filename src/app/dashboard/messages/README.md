# Messages Implementation

This directory contains the implementation of the messages feature based on the mongo-nextjs inbox implementation. The feature allows users to:

1. Select a community from a list
2. View users who have sent or received messages in that community
3. View and send messages to selected users

## Key Components

### `page.tsx`

The main page component that lists all available communities. It includes:

- Community search functionality
- Grid display of communities
- Navigation to community-specific message pages

### `[communityId]/page.tsx`

The community-specific message page that displays:

- List of users who have sent or received messages in the community
- User search functionality
- Conversation view with message history
- Message input for sending new messages

## Data Flow

1. **Community Loading**:
   - The main page queries the Firestore 'communities' collection
   - Displays communities in a grid layout
   - Allows filtering by name

2. **User Loading**:
   - When a community is selected, the community-specific page loads
   - Queries messages related to that community
   - Identifies users who have sent or received messages
   - Displays users in a sidebar list with their latest message

3. **Message Loading**:
   - When a user is selected, filters messages to show only those related to the selected user
   - Sorts messages chronologically
   - Displays messages in a conversation view with appropriate styling for sent vs received messages

## Implementation Notes

- Uses the same data loading pattern as the mongo-nextjs inbox implementation
- Combines messages from both 'messages' and 'sendwamessagehistories' collections
- Identifies users involved in conversations by checking message sender and readBy fields
- Maintains consistent UI with the rest of the dashboard

## Future Improvements

- Implement real-time message updates using Firestore listeners
- Add message sending functionality
- Add typing indicators and message status (sent, delivered, read)
- Support for media attachments and template messages
