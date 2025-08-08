# Form Automation Documentation

## Overview

Form Automation is a comprehensive feature that enables automated multi-step form filling workflows during screenshot capture. This system allows users to automate complex form interactions, validate submissions, and capture screenshots at various stages of the process.

## Table of Contents

- [Architecture](#architecture)
- [Frontend Implementation](#frontend-implementation)
- [Backend Implementation](#backend-implementation)
- [API Reference](#api-reference)
- [Configuration Options](#configuration-options)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Architecture

### System Flow

```
User Input → Frontend UI → API Request → Backend Controller → Screenshot Service → Playwright Automation → Screenshot Capture
```

### Key Components

1. **Frontend UI**: React-based form builder with dynamic step management
2. **API Layer**: RESTful endpoints for form automation configuration
3. **Backend Service**: Playwright-powered automation engine
4. **Screenshot Engine**: Multi-point capture system with validation

## Frontend Implementation

### Component Structure

The Form Automation UI is implemented in `AddScreenshotModal.tsx` as a collapsible section:

```tsx
// File: frontend/src/components/modals/AddScreenshotModal.tsx

interface ScreenshotFormData {
  formSteps?: Array<{
    stepName: string
    formInputs: Array<{
      selector: string
      value: string
      inputType: 'text' | 'select' | 'checkbox' | 'radio' | 'textarea'
    }>
    submitTrigger?: {
      selector: string
      waitAfter: number
    }
    validationChecks?: Array<{
      selector: string
      expectedText?: string
      checkType: 'exists' | 'text' | 'class' | 'attribute'
      expectedClass?: string
      attribute?: string
      expectedValue?: string
    }>
    stepTimeout: number
    takeScreenshotAfterFill: boolean
    takeScreenshotAfterSubmit: boolean
    takeScreenshotAfterValidation: boolean
  }>
}
```

### UI State Management

```tsx
// Collapsible section state
const [showFormAutomation, setShowFormAutomation] = useState(false)

// Form data state
const [formData, setFormData] = useState<ScreenshotFormData>({
  // ... other fields
  formSteps: []
})
```

### Dynamic Form Builder

The UI provides dynamic management of form steps:

```tsx
// Add new form step
const addFormStep = () => {
  const newStep = {
    stepName: '',
    formInputs: [],
    stepTimeout: 5000,
    takeScreenshotAfterFill: true,
    takeScreenshotAfterSubmit: true,
    takeScreenshotAfterValidation: false
  }
  setFormData(prev => ({ 
    ...prev, 
    formSteps: [...(prev.formSteps || []), newStep] 
  }))
}

// Remove form step
const removeFormStep = (stepIndex: number) => {
  const newSteps = [...(formData.formSteps || [])]
  newSteps.splice(stepIndex, 1)
  setFormData(prev => ({ ...prev, formSteps: newSteps }))
}
```

### Input Field Management

Each form step supports multiple input types:

```tsx
// Add form input to step
const addFormInput = (stepIndex: number) => {
  const newSteps = [...(formData.formSteps || [])]
  const newInput = {
    selector: '',
    value: '',
    inputType: 'text'
  }
  newSteps[stepIndex].formInputs.push(newInput)
  setFormData(prev => ({ ...prev, formSteps: newSteps }))
}

// Update form input
const updateFormInput = (stepIndex: number, inputIndex: number, field: string, value: string) => {
  const newSteps = [...(formData.formSteps || [])]
  newSteps[stepIndex].formInputs[inputIndex] = {
    ...newSteps[stepIndex].formInputs[inputIndex],
    [field]: value
  }
  setFormData(prev => ({ ...prev, formSteps: newSteps }))
}
```

### Styling Standards

All form automation inputs use consistent styling:

```tsx
// Standard input styling
className="px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"

// Collapsible section container
className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
```

## Backend Implementation

### Controller Integration

Form automation parameters are extracted in screenshot controllers:

```typescript
// File: backend/src/controllers/screenshotController.ts

export const createScreenshot = async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      url,
      // ... other parameters
      formSteps
    } = req.body

    const jobData: ScreenshotJobData = {
      // ... other job data
      formSteps: formSteps || undefined
    }

    // Schedule screenshot job
    await screenshotQueue.now('screenshot', jobData)
    
    res.status(201).json({ success: true, screenshot })
  } catch (error) {
    // Error handling
  }
}
```

### Service Layer Implementation

The core form automation logic is in `ScreenshotService.ts`:

```typescript
// File: backend/src/services/ScreenshotService.ts

interface FormStep {
  stepName: string
  formInputs: FormInput[]
  submitTrigger?: SubmitTrigger
  validationChecks?: ValidationCheck[]
  stepTimeout: number
  takeScreenshotAfterFill: boolean
  takeScreenshotAfterSubmit: boolean
  takeScreenshotAfterValidation: boolean
}

interface FormInput {
  selector: string
  value: string
  inputType: 'text' | 'select' | 'checkbox' | 'radio' | 'textarea'
}

interface SubmitTrigger {
  selector: string
  waitAfter: number
}

interface ValidationCheck {
  selector: string
  expectedText?: string
  checkType: 'exists' | 'text' | 'class' | 'attribute'
  expectedClass?: string
  attribute?: string
  expectedValue?: string
}
```

### Main Automation Method

```typescript
private async executeFormAutomation(
  page: Page, 
  formSteps: FormStep[],
  screenshotDir: string,
  userId: string,
  screenshotId: string
): Promise<string[]> {
  const screenshots: string[] = []
  
  for (const [stepIndex, step] of formSteps.entries()) {
    try {
      // Emit progress update
      this.io.to(userId).emit('screenshot-progress', {
        screenshotId,
        message: `Executing form step: ${step.stepName}`,
        progress: Math.round(((stepIndex + 1) / formSteps.length) * 50) // 50% of total progress
      })

      // Set timeout for this step
      page.setDefaultTimeout(step.stepTimeout)
      
      // Fill form inputs
      for (const input of step.formInputs) {
        await this.fillFormInput(page, input)
      }
      
      // Take screenshot after filling if requested
      if (step.takeScreenshotAfterFill) {
        const screenshot = await this.captureStepScreenshot(
          page, screenshotDir, `step-${stepIndex + 1}-filled`
        )
        screenshots.push(screenshot)
      }
      
      // Submit form if trigger is provided
      if (step.submitTrigger) {
        await page.click(step.submitTrigger.selector)
        await page.waitForTimeout(step.submitTrigger.waitAfter)
        
        if (step.takeScreenshotAfterSubmit) {
          const screenshot = await this.captureStepScreenshot(
            page, screenshotDir, `step-${stepIndex + 1}-submitted`
          )
          screenshots.push(screenshot)
        }
      }
      
      // Perform validation checks
      if (step.validationChecks) {
        await this.performValidationChecks(page, step.validationChecks)
        
        if (step.takeScreenshotAfterValidation) {
          const screenshot = await this.captureStepScreenshot(
            page, screenshotDir, `step-${stepIndex + 1}-validated`
          )
          screenshots.push(screenshot)
        }
      }
      
    } catch (error) {
      console.error(`Form automation step ${stepIndex + 1} failed:`, error)
      
      // Emit error but continue
      this.io.to(userId).emit('screenshot-progress', {
        screenshotId,
        message: `Form step ${stepIndex + 1} failed, continuing...`,
        progress: Math.round(((stepIndex + 1) / formSteps.length) * 50)
      })
    }
  }
  
  return screenshots
}
```

### Input Handling Methods

```typescript
private async fillFormInput(page: Page, input: FormInput): Promise<void> {
  const { selector, value, inputType } = input

  switch (inputType) {
    case 'text':
    case 'textarea':
      await page.fill(selector, value)
      break
      
    case 'select':
      await page.selectOption(selector, value)
      break
      
    case 'checkbox':
      const isChecked = value.toLowerCase() === 'true'
      await page.setChecked(selector, isChecked)
      break
      
    case 'radio':
      if (value.toLowerCase() === 'true') {
        await page.check(selector)
      }
      break
      
    default:
      throw new Error(`Unsupported input type: ${inputType}`)
  }
}
```

### Validation Methods

```typescript
private async performValidationChecks(page: Page, checks: ValidationCheck[]): Promise<void> {
  for (const check of checks) {
    const { selector, checkType, expectedText, expectedClass, attribute, expectedValue } = check

    switch (checkType) {
      case 'exists':
        await page.waitForSelector(selector, { timeout: 5000 })
        break
        
      case 'text':
        if (expectedText) {
          await page.waitForFunction(
            `document.querySelector('${selector}')?.textContent?.includes('${expectedText}')`
          )
        }
        break
        
      case 'class':
        if (expectedClass) {
          await page.waitForFunction(
            `document.querySelector('${selector}')?.classList.contains('${expectedClass}')`
          )
        }
        break
        
      case 'attribute':
        if (attribute && expectedValue) {
          await page.waitForFunction(
            `document.querySelector('${selector}')?.getAttribute('${attribute}') === '${expectedValue}'`
          )
        }
        break
        
      default:
        throw new Error(`Unsupported validation check type: ${checkType}`)
    }
  }
}
```

### Screenshot Capture

```typescript
private async captureStepScreenshot(
  page: Page, 
  screenshotDir: string, 
  filename: string
): Promise<string> {
  const screenshotPath = path.join(screenshotDir, `${filename}.png`)
  
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    type: 'png'
  })
  
  return screenshotPath
}
```

### Integration with Main Screenshot Flow

```typescript
async captureScreenshot(jobData: ScreenshotJobData): Promise<void> {
  // ... existing screenshot setup code

  try {
    // Execute form automation if provided
    if (jobData.formSteps && jobData.formSteps.length > 0) {
      const formScreenshots = await this.executeFormAutomation(
        page,
        jobData.formSteps,
        screenshotDir,
        jobData.userId,
        jobData.screenshotId
      )
      
      // Add form automation screenshots to the collection
      screenshots.push(...formScreenshots)
    }

    // Continue with main screenshot capture
    const mainScreenshot = await page.screenshot({
      path: screenshotPath,
      fullPage: jobData.options?.fullPage || false,
      type: 'png'
    })

    // ... rest of screenshot processing
  } catch (error) {
    // Error handling
  }
}
```

## API Reference

### Request Format

```typescript
POST /api/screenshots
{
  "projectId": "string",
  "url": "string",
  "formSteps": [
    {
      "stepName": "string",
      "formInputs": [
        {
          "selector": "string",
          "value": "string",
          "inputType": "text" | "select" | "checkbox" | "radio" | "textarea"
        }
      ],
      "submitTrigger": {
        "selector": "string",
        "waitAfter": number
      },
      "validationChecks": [
        {
          "selector": "string",
          "expectedText": "string",
          "checkType": "exists" | "text" | "class" | "attribute",
          "expectedClass": "string",
          "attribute": "string",
          "expectedValue": "string"
        }
      ],
      "stepTimeout": number,
      "takeScreenshotAfterFill": boolean,
      "takeScreenshotAfterSubmit": boolean,
      "takeScreenshotAfterValidation": boolean
    }
  ]
}
```

### Response Format

```typescript
{
  "success": boolean,
  "screenshot": {
    "_id": "string",
    "url": "string",
    "imagePath": "string",
    "thumbnailPath": "string",
    "formAutomationScreenshots": ["string"], // Paths to form automation screenshots
    "status": "completed" | "failed",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

## Configuration Options

### Step Configuration

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `stepName` | string | Yes | - | Descriptive name for the step |
| `formInputs` | FormInput[] | Yes | [] | Array of form inputs to fill |
| `submitTrigger` | SubmitTrigger | No | undefined | Form submission configuration |
| `validationChecks` | ValidationCheck[] | No | [] | Post-submission validation |
| `stepTimeout` | number | No | 5000 | Step timeout in milliseconds |
| `takeScreenshotAfterFill` | boolean | No | true | Capture after filling inputs |
| `takeScreenshotAfterSubmit` | boolean | No | true | Capture after form submission |
| `takeScreenshotAfterValidation` | boolean | No | false | Capture after validation |

### Input Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `selector` | string | Yes | CSS selector for the input element |
| `value` | string | Yes | Value to enter or select |
| `inputType` | string | Yes | Type of input: text, select, checkbox, radio, textarea |

### Submit Trigger Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `selector` | string | Yes | CSS selector for submit button/element |
| `waitAfter` | number | No | Wait time after submission (ms) |

### Validation Check Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `selector` | string | Yes | CSS selector for validation element |
| `checkType` | string | Yes | Type: exists, text, class, attribute |
| `expectedText` | string | No | Expected text content (for 'text' type) |
| `expectedClass` | string | No | Expected CSS class (for 'class' type) |
| `attribute` | string | No | Attribute name (for 'attribute' type) |
| `expectedValue` | string | No | Expected attribute value (for 'attribute' type) |

## Error Handling

### Frontend Error Handling

```tsx
// Form validation
const validateFormStep = (step: FormStep): string[] => {
  const errors: string[] = []
  
  if (!step.stepName.trim()) {
    errors.push('Step name is required')
  }
  
  if (step.formInputs.length === 0) {
    errors.push('At least one form input is required')
  }
  
  step.formInputs.forEach((input, index) => {
    if (!input.selector.trim()) {
      errors.push(`Input ${index + 1}: Selector is required`)
    }
    if (!input.value.trim()) {
      errors.push(`Input ${index + 1}: Value is required`)
    }
  })
  
  return errors
}

// Error display
const [formErrors, setFormErrors] = useState<string[]>([])

const handleSubmit = () => {
  const allErrors: string[] = []
  
  formData.formSteps?.forEach((step, index) => {
    const stepErrors = validateFormStep(step)
    allErrors.push(...stepErrors.map(error => `Step ${index + 1}: ${error}`))
  })
  
  if (allErrors.length > 0) {
    setFormErrors(allErrors)
    return
  }
  
  // Proceed with submission
}
```

### Backend Error Handling

```typescript
// Step-level error isolation
try {
  await this.executeFormAutomation(page, formSteps, screenshotDir, userId, screenshotId)
} catch (error) {
  console.error('Form automation failed:', error)
  
  // Emit error notification
  this.io.to(userId).emit('screenshot-progress', {
    screenshotId,
    message: 'Form automation failed, continuing with main screenshot',
    progress: 50
  })
  
  // Continue with main screenshot capture
}

// Input-level error handling
private async fillFormInput(page: Page, input: FormInput): Promise<void> {
  try {
    // Input filling logic
  } catch (error) {
    console.error(`Failed to fill input ${input.selector}:`, error)
    throw new Error(`Input filling failed: ${error.message}`)
  }
}

// Validation error handling
private async performValidationChecks(page: Page, checks: ValidationCheck[]): Promise<void> {
  for (const check of checks) {
    try {
      // Validation logic
    } catch (error) {
      console.error(`Validation check failed for ${check.selector}:`, error)
      throw new Error(`Validation failed: ${error.message}`)
    }
  }
}
```

## Best Practices

### Selector Strategy

1. **Use Stable Selectors**
   ```javascript
   // Good
   "#email-input"
   "[data-testid='password-field']"
   "input[name='username']"
   
   // Avoid
   ".form-input:nth-child(2)"
   ".btn.btn-primary.submit"
   ```

2. **Test Selectors**
   - Use browser dev tools to verify selectors
   - Test on different screen sizes
   - Verify selectors work with dynamic content

### Timing Configuration

1. **Set Appropriate Timeouts**
   ```javascript
   {
     "stepTimeout": 10000,  // 10 seconds for complex forms
     "submitTrigger": {
       "waitAfter": 3000    // 3 seconds for processing
     }
   }
   ```

2. **Consider Network Conditions**
   - Add buffer time for slow networks
   - Use longer waits for AJAX-heavy forms
   - Account for server processing time

### Screenshot Strategy

1. **Strategic Capture Points**
   ```javascript
   {
     "takeScreenshotAfterFill": true,    // Capture filled form
     "takeScreenshotAfterSubmit": true,  // Capture submission result
     "takeScreenshotAfterValidation": false // Skip if not needed
   }
   ```

2. **Performance Considerations**
   - Balance screenshot frequency with performance
   - Use descriptive step names for organization
   - Consider storage implications

### Form Design Patterns

1. **Multi-Step Forms**
   ```javascript
   [
     {
       "stepName": "Personal Information",
       "formInputs": [/* personal fields */],
       "submitTrigger": { "selector": ".next-step" }
     },
     {
       "stepName": "Account Details", 
       "formInputs": [/* account fields */],
       "submitTrigger": { "selector": ".submit-form" },
       "validationChecks": [/* success validation */]
     }
   ]
   ```

2. **Login Workflows**
   ```javascript
   [
     {
       "stepName": "Login",
       "formInputs": [
         { "selector": "#username", "value": "user@example.com", "inputType": "text" },
         { "selector": "#password", "value": "password123", "inputType": "text" }
       ],
       "submitTrigger": { "selector": "#login-btn", "waitAfter": 2000 },
       "validationChecks": [
         { "selector": ".dashboard", "checkType": "exists" }
       ]
     }
   ]
   ```

## Troubleshooting

### Common Issues

1. **Element Not Found**
   - **Cause**: Incorrect selector or timing
   - **Solution**: Verify selector in dev tools, increase timeout
   - **Debug**: Check if element loads dynamically

2. **Form Not Submitting**
   - **Cause**: Wrong submit selector or insufficient wait time
   - **Solution**: Verify submit button selector, increase waitAfter
   - **Debug**: Check for JavaScript form validation

3. **Validation Failing**
   - **Cause**: Validation elements not appearing or wrong expectations
   - **Solution**: Check validation element timing, verify expected values
   - **Debug**: Monitor network requests during submission

4. **Timeout Errors**
   - **Cause**: Insufficient timeout for slow forms
   - **Solution**: Increase stepTimeout value
   - **Debug**: Check form processing time in browser

### Debug Techniques

1. **Browser Dev Tools**
   ```javascript
   // Test selectors in console
   document.querySelector('#email-input')
   document.querySelectorAll('.form-field')
   ```

2. **Network Monitoring**
   - Monitor XHR requests during form submission
   - Check for AJAX responses
   - Verify API call timing

3. **Progressive Testing**
   - Start with simple single-step forms
   - Add complexity gradually
   - Test each input type individually

4. **Logging Analysis**
   ```typescript
   // Backend logging
   console.log('Form step started:', step.stepName)
   console.log('Input filled:', input.selector, input.value)
   console.log('Form submitted, waiting:', submitTrigger.waitAfter)
   console.log('Validation completed for:', check.selector)
   ```

### Performance Optimization

1. **Minimize Screenshots**
   - Only capture necessary stages
   - Use validation screenshots sparingly
   - Consider storage and processing costs

2. **Optimize Timeouts**
   - Use minimum necessary timeouts
   - Adjust based on form complexity
   - Monitor actual processing times

3. **Efficient Selectors**
   - Use ID selectors when possible
   - Avoid complex CSS selectors
   - Test selector performance

---

*Last Updated: January 2025*
*Version: 1.0.0*
