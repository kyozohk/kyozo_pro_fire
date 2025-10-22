# Dashboard Components

## CommunityMembersList

A modern, responsive component for displaying community members with search functionality and action buttons.

![CommunityMembersList Component](https://path-to-screenshot.png)

### Features

- Clean, modern design with hover effects
- Built-in search functionality
- Support for member avatars with fallback
- Action buttons for common operations (edit, message, call, email, delete)
- Fully responsive design
- Matches the dark theme of the application

### Usage

```tsx
import { CommunityMembersList } from '@/components/dashboard';

// Your component
const YourComponent = () => {
  const members = [
    {
      id: '1',
      fullName: 'Ben Zen',
      email: 'ben@example.com',
      phoneNumber: '+1 6468092088',
      role: 'member'
    },
    // More members...
  ];

  const handleEdit = (member) => {
    // Handle edit action
  };

  const handleMessage = (member) => {
    // Handle message action
  };

  return (
    <CommunityMembersList
      members={members}
      onEdit={handleEdit}
      onMessage={handleMessage}
      onCall={(member) => console.log('Call', member)}
      onEmail={(member) => console.log('Email', member)}
      onDelete={(member) => console.log('Delete', member)}
    />
  );
};
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `members` | `Member[]` | Array of member objects to display |
| `onEdit` | `(member: Member) => void` | Optional. Handler for edit button click |
| `onMessage` | `(member: Member) => void` | Optional. Handler for message button click |
| `onCall` | `(member: Member) => void` | Optional. Handler for call button click |
| `onEmail` | `(member: Member) => void` | Optional. Handler for email button click |
| `onDelete` | `(member: Member) => void` | Optional. Handler for delete button click |
| `className` | `string` | Optional. Additional CSS classes to apply |

### Member Interface

```tsx
interface Member {
  id: string;
  fullName?: string;
  name?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  waNumber?: string;
  profileImage?: string;
  role?: string;
  status?: 'active' | 'pending' | 'inactive';
}
```

### Example Implementation

See `/src/app/dashboard/members/example-implementation.tsx` for a complete example of how to use this component with Firestore data.

### Demo

A demo page is available at `/dashboard/members-demo` which showcases the component with sample data.
