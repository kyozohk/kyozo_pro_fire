# Kyozo Pro Fire

A Next.js application with SASS styling and custom UI components.

## Features

- Next.js framework with TypeScript
- Pure SASS styling with dark theme (no Tailwind)
- Custom UI components with floating labels
- Firebase integration
- Communities and Messages UI components

## Dark Theme

The project uses a dark theme imported from the reference project. The theme includes:

- Dark background colors
- Light text colors
- Accent colors (pink, purple, blue)
- Custom form elements styling
- Card and container styles

## Custom Components

The project includes several custom UI components with SASS styling:

### FloatingLabelInput

A text input component with a floating label that animates when focused or filled.

```tsx
<FloatingLabelInput 
  label="Email" 
  placeholder="Enter your email" 
  type="email" 
  value={email} 
  onChange={(e) => setEmail(e.target.value)} 
/>
```

### CustomCheckbox

A styled checkbox component with custom design.

```tsx
<CustomCheckbox 
  id="terms" 
  name="terms" 
  label="I agree to the terms and conditions" 
  checked={termsAccepted} 
  onChange={(e) => setTermsAccepted(e.target.checked)} 
/>
```

### CustomRadio

A styled radio button component.

```tsx
<CustomRadio 
  id="option1" 
  name="options" 
  value="option1" 
  label="Option 1" 
  checked={selectedOption === 'option1'} 
  onChange={(e) => setSelectedOption(e.target.value)} 
/>
```

### CustomDropdown

A custom dropdown select component with floating label.

```tsx
<CustomDropdown 
  label="Select an option" 
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]} 
  value={selectedValue} 
  onChange={(value) => setSelectedValue(value)} 
/>
```

### CustomSelect

A styled select component with dropdown menu.

```tsx
<CustomSelect 
  id="select-example"
  name="select-example"
  placeholder="Select an option"
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]}
  value={selectValue}
  onChange={(e) => setSelectValue(e.target.value)}
/>
```

### CustomDialog

A modal dialog component with animations.

```tsx
<CustomDialog 
  isOpen={isDialogOpen} 
  onClose={() => setIsDialogOpen(false)} 
  title="Dialog Title" 
  subtitle="Dialog subtitle text" 
>
  <p>Dialog content goes here</p>
</CustomDialog>
```

## Communities and Messages UI

The project includes styles for displaying communities and messages lists:

- Communities grid with gradient borders
- Community cards with stats and activity indicators
- Messages layout with conversations list and chat area
- Message bubbles with sender avatars

Check out the examples page at `/examples` to see all components in action.

## Getting Started

1. Install dependencies:
   ```
   pnpm install
   ```

2. Run the development server:
   ```
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Visit [http://localhost:3000/examples](http://localhost:3000/examples) to see all the custom components.