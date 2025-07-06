# TaskForm Validation with Yup

## Overview
The TaskForm component now includes comprehensive form validation using Yup schema validation library. The validation provides real-time feedback to users and prevents submission of invalid data.

## Installation
```bash
pnpm add yup
```

## Validation Rules

### Required Fields
- **Task Name** (*)
  - Required
  - Min: 1 character
  - Max: 100 characters
  - Trimmed whitespace

- **Icon** (*)
  - Required
  - Default: '📝'

- **Color Theme** (*)
  - Required
  - Default: 'ocean'

- **Priority** (*)
  - Required
  - Values: 'low', 'medium', 'high', 'urgent'
  - Default: 'medium'

- **Progress** (*)
  - Required
  - Range: 0-100
  - Default: 0

- **Tags** (*)
  - At least 1 tag required
  - Maximum 10 tags allowed

### Optional Fields
- **Description**
  - Optional
  - Max: 500 characters

- **Notes**
  - Optional
  - Max: 1000 characters

- **Due Date**
  - Optional
  - Must be in the future (create mode only)
  - Any date allowed in edit mode

- **Goal ID**
  - Optional
  - Links task to a goal

## Implementation Details

### Validation Schema
Located in `TaskFormValidation.ts`:
```typescript
export const createTaskFormSchema = (mode: 'create' | 'edit') => yup.object().shape({
  name: yup.string().required('Task name is required').min(1).max(100).trim(),
  // ... other fields
});
```

### Validation Functions
1. **validateTaskForm**: Validates entire form
2. **validateField**: Validates individual fields on blur

### UI Integration
- Real-time validation on field blur
- Error messages displayed below fields
- Red border for fields with errors
- Submit button validates all fields before submission
- All fields marked as touched on submit attempt

### Error Styling
```typescript
formInputError: {
  borderColor: '#EF4444',
},
errorText: {
  fontSize: 12,
  color: '#EF4444',
  marginTop: 4,
},
```

## Usage Example
```tsx
<TaskForm
  mode="create"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  initialValues={{
    priority: 'medium',
    tags: ['work'],
    progress: 0,
  }}
/>
```

## Testing
Unit tests are provided in `__tests__/TaskFormValidation.test.ts` covering:
- Valid data scenarios
- Missing required fields
- Field length validation
- Value range validation
- Mode-specific validation (create vs edit)

## Future Enhancements
- Custom validation messages per field
- Async validation for unique task names
- Field-level dependency validation
- Custom validation for recurring tasks