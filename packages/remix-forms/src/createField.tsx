import * as React from 'react'
import type { SomeZodObject, z } from 'zod'
import type { UseFormRegister, UseFormRegisterReturn } from 'react-hook-form'
import type { Field } from './createForm'
import { mapChildren } from './childrenTraversal'
import { coerceValue } from './coercions'
import { ComponentOrTagName, mapObject, parseDate } from './prelude'

type Option = { name: string } & Required<
  Pick<React.OptionHTMLAttributes<HTMLOptionElement>, 'value'>
>

type Children<Schema extends SomeZodObject> = (
  helpers: FieldBaseProps<Schema> & {
    Label: ComponentOrTagName<'label'>
    SmartInput: React.ComponentType<SmartInputProps>
    Input:
      | React.ForwardRefExoticComponent<
          React.PropsWithoutRef<JSX.IntrinsicElements['input']> &
            React.RefAttributes<HTMLInputElement>
        >
      | string
    Multiline:
      | React.ForwardRefExoticComponent<
          React.PropsWithoutRef<JSX.IntrinsicElements['textarea']> &
            React.RefAttributes<HTMLTextAreaElement>
        >
      | string
    Select:
      | React.ForwardRefExoticComponent<
          React.PropsWithoutRef<JSX.IntrinsicElements['select']> &
            React.RefAttributes<HTMLSelectElement>
        >
      | string
    Checkbox:
      | React.ForwardRefExoticComponent<
          React.PropsWithoutRef<JSX.IntrinsicElements['input']> &
            React.RefAttributes<HTMLInputElement>
        >
      | string
    CheckboxWrapper: ComponentOrTagName<'div'>
    Errors: ComponentOrTagName<'div'>
    Error: ComponentOrTagName<'div'>
    ref: React.ForwardedRef<any>
  },
) => React.ReactNode

type FieldType = 'string' | 'boolean' | 'number' | 'date'

const types: Record<FieldType, React.HTMLInputTypeAttribute> = {
  boolean: 'checkbox',
  string: 'text',
  number: 'text',
  date: 'date',
}

type FieldBaseProps<Schema extends SomeZodObject> = Omit<
  Partial<Field<z.infer<Schema>>>,
  'name'
> & {
  name: keyof z.infer<Schema>
  type?: JSX.IntrinsicElements['input']['type']
  children?: Children<Schema>
}

type FieldProps<Schema extends SomeZodObject> = FieldBaseProps<Schema> &
  Omit<JSX.IntrinsicElements['div'], 'children'>

type FieldComponent<Schema extends SomeZodObject> =
  React.ForwardRefExoticComponent<FieldProps<Schema> & React.RefAttributes<any>>

type ComponentMappings = {
  fieldComponent?: ComponentOrTagName<'div'>
  labelComponent?: ComponentOrTagName<'label'>
  inputComponent?:
    | React.ForwardRefExoticComponent<
        React.PropsWithoutRef<JSX.IntrinsicElements['input']> &
          React.RefAttributes<HTMLInputElement>
      >
    | string
  multilineComponent?:
    | React.ForwardRefExoticComponent<
        React.PropsWithoutRef<JSX.IntrinsicElements['textarea']> &
          React.RefAttributes<HTMLTextAreaElement>
      >
    | string
  selectComponent?:
    | React.ForwardRefExoticComponent<
        React.PropsWithoutRef<JSX.IntrinsicElements['select']> &
          React.RefAttributes<HTMLSelectElement>
      >
    | string
  checkboxComponent?:
    | React.ForwardRefExoticComponent<
        React.PropsWithoutRef<JSX.IntrinsicElements['input']> &
          React.RefAttributes<HTMLInputElement>
      >
    | string
  radioComponent?:
    | React.ForwardRefExoticComponent<
        React.PropsWithoutRef<JSX.IntrinsicElements['input']> &
          React.RefAttributes<HTMLInputElement>
      >
    | string
  checkboxWrapperComponent?: ComponentOrTagName<'div'>
  radioWrapperComponent?: ComponentOrTagName<'div'>
  fieldErrorsComponent?: ComponentOrTagName<'div'>
  errorComponent?: ComponentOrTagName<'div'>
}

type SmartInputProps = {
  fieldType?: FieldType
  type?: React.HTMLInputTypeAttribute
  value?: any
  autoFocus?: boolean
  selectChildren?: JSX.Element[]
  options?: Option[]
  multiline?: boolean
  radio?: boolean
  placeholder?: string
  registerProps?: UseFormRegisterReturn
  className?: string
  a11yProps?: Record<`aria-${string}`, string | boolean | undefined>
}

const makeSelectOption = ({ name, value }: Option) => (
  <option key={String(value)} value={value}>
    {name}
  </option>
)

const makeRadioOption =
  (props: Record<string, unknown>) =>
  ({ name, value }: Option) => {
    const propsWithUniqueId = mapObject(props, (key, propValue) =>
      key === 'id' ? [key, `${propValue}-${value}`] : [key, propValue],
    )
    return (
      <>
        <input type="radio" value={value} {...propsWithUniqueId} />
        <label htmlFor={String(propsWithUniqueId?.id)}>{name}</label>
      </>
    )
  }

const makeOptionComponents = (
  fn: (option: Option) => JSX.Element,
  options: Option[] | undefined,
) => (options ? options.map(fn) : undefined)

function createSmartInput({
  inputComponent: Input = 'input',
  multilineComponent: Multiline = 'textarea',
  selectComponent: Select = 'select',
  checkboxComponent: Checkbox = 'input',
}: ComponentMappings) {
  // eslint-disable-next-line react/display-name
  return ({
    fieldType,
    type,
    value,
    autoFocus,
    selectChildren,
    options,
    multiline,
    radio,
    placeholder,
    registerProps,
    a11yProps,
    ...props
  }: SmartInputProps) => {
    if (!registerProps) return null

    const { name } = registerProps

    const commonProps = {
      id: name,
      autoFocus,
      ...registerProps,
      ...a11yProps,
      ...props,
    }

    return fieldType === 'boolean' ? (
      <Checkbox
        type="checkbox"
        placeholder={placeholder}
        defaultChecked={Boolean(value)}
        {...commonProps}
      />
    ) : (selectChildren || options) && !radio ? (
      <Select defaultValue={value} {...commonProps}>
        {selectChildren ?? makeOptionComponents(makeSelectOption, options)}
      </Select>
    ) : options && radio ? (
      <>{makeOptionComponents(makeRadioOption(commonProps), options)}</>
    ) : multiline ? (
      <Multiline
        placeholder={placeholder}
        defaultValue={value}
        {...commonProps}
      />
    ) : (
      <Input
        type={type}
        placeholder={placeholder}
        defaultValue={value}
        {...commonProps}
      />
    )
  }
}

function createField<Schema extends SomeZodObject>({
  register,
  fieldComponent: Field = 'div',
  labelComponent: Label = 'label',
  inputComponent: Input = 'input',
  multilineComponent: Multiline = 'textarea',
  selectComponent: Select = 'select',
  radioComponent: Radio = 'input',
  checkboxComponent: Checkbox = 'input',
  checkboxWrapperComponent: CheckboxWrapper = 'div',
  radioWrapperComponent: RadioWrapper = 'div',
  fieldErrorsComponent: Errors = 'div',
  errorComponent: Error = 'div',
}: {
  register: UseFormRegister<any>
} & ComponentMappings): FieldComponent<Schema> {
  // eslint-disable-next-line react/display-name
  return React.forwardRef<any, FieldProps<Schema>>(
    (
      {
        fieldType = 'string',
        shape,
        name,
        label,
        options,
        errors,
        dirty,
        type: typeProp,
        required = false,
        autoFocus = false,
        value: rawValue,
        multiline = false,
        radio = false,
        placeholder,
        hidden = false,
        children: childrenFn,
        ...props
      },
      ref,
    ) => {
      const value = fieldType === 'date' ? parseDate(rawValue) : rawValue

      const errorsChildren = errors?.length
        ? errors.map((error) => <Error key={error}>{error}</Error>)
        : undefined

      const style = hidden ? { display: 'none' } : undefined
      const type = typeProp ?? types[fieldType]

      const registerProps = register(String(name), {
        setValueAs: (value) => coerceValue(value, shape),
      })

      const labelId = `label-for-${name.toString()}`
      const errorsId = `errors-for-${name.toString()}`

      const a11yProps = {
        'aria-labelledby': labelId,
        'aria-invalid': Boolean(errors),
        'aria-describedby': errors ? errorsId : undefined,
        'aria-required': required,
      }

      const SmartInput = React.useMemo(
        () =>
          createSmartInput({
            inputComponent: Input,
            multilineComponent: Multiline,
            selectComponent: Select,
            checkboxComponent: Checkbox,
            radioComponent: Radio,
          }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [Input, Multiline, Select, Checkbox],
      )

      if (childrenFn) {
        const children = childrenFn({
          Label,
          SmartInput,
          Input,
          Multiline,
          Select,
          Checkbox,
          CheckboxWrapper,
          Errors,
          Error,
          ref,
          shape,
          fieldType,
          name,
          required,
          label,
          type,
          options,
          errors,
          autoFocus,
          value,
          hidden,
          multiline,
          radio,
          placeholder,
        })

        return (
          <Field hidden={hidden} style={style} {...props}>
            {mapChildren(children, (child) => {
              if (!React.isValidElement(child)) return child

              if (child.type === Label) {
                return React.cloneElement(child, {
                  id: labelId,
                  htmlFor: String(name),
                  children: label,
                  ...child.props,
                })
              } else if (child.type === SmartInput) {
                return React.cloneElement(child, {
                  fieldType,
                  type,
                  selectChildren: makeOptionComponents(
                    makeSelectOption,
                    options,
                  ),
                  options: options,
                  multiline,
                  radio,
                  placeholder,
                  registerProps,
                  autoFocus,
                  value,
                  a11yProps,
                  ...child.props,
                })
              } else if (child.type === Input) {
                return React.cloneElement(child, {
                  id: String(name),
                  type,
                  ...registerProps,
                  ...a11yProps,
                  placeholder,
                  autoFocus,
                  defaultValue: value,
                  ...child.props,
                })
              } else if (child.type === Multiline) {
                return React.cloneElement(child, {
                  id: String(name),
                  ...registerProps,
                  ...a11yProps,
                  placeholder,
                  autoFocus,
                  defaultValue: value,
                  ...child.props,
                })
              } else if (child.type === Select) {
                return React.cloneElement(child, {
                  id: String(name),
                  ...registerProps,
                  ...a11yProps,
                  autoFocus,
                  defaultValue: value,
                  children: makeOptionComponents(makeSelectOption, options),
                  ...child.props,
                })
              } else if (child.type === Checkbox) {
                return React.cloneElement(child, {
                  id: String(name),
                  type,
                  autoFocus,
                  ...registerProps,
                  ...a11yProps,
                  placeholder,
                  defaultChecked: Boolean(value),
                  ...child.props,
                })
              } else if (child.type === Errors) {
                if (!child.props.children && !errors?.length) return null

                if (child.props.children || !errors?.length) {
                  return React.cloneElement(child, {
                    id: errorsId,
                    role: 'alert',
                    ...child.props,
                  })
                }

                return React.cloneElement(child, {
                  id: errorsId,
                  role: 'alert',
                  children: errorsChildren,
                  ...child.props,
                })
              } else {
                return child
              }
            })}
          </Field>
        )
      }

      const smartInput = (
        <SmartInput
          fieldType={fieldType}
          type={type}
          selectChildren={makeOptionComponents(makeSelectOption, options)}
          options={options}
          multiline={multiline}
          radio={radio}
          placeholder={placeholder}
          registerProps={registerProps}
          autoFocus={autoFocus}
          value={value}
          a11yProps={a11yProps}
        />
      )

      return (
        <Field hidden={hidden} style={style} {...props}>
          {fieldType === 'boolean' ? (
            <CheckboxWrapper>
              {smartInput}
              <Label id={labelId} htmlFor={String(name)}>
                {label}
              </Label>
            </CheckboxWrapper>
          ) : type === 'radio' ? (
            <RadioWrapper>{smartInput}</RadioWrapper>
          ) : (
            <>
              <Label id={labelId} htmlFor={String(name)}>
                {label}
              </Label>
              {smartInput}
            </>
          )}
          {Boolean(errorsChildren) && (
            <Errors role="alert" id={errorsId}>
              {errorsChildren}
            </Errors>
          )}
        </Field>
      )
    },
  )
}

export type { FieldType, FieldComponent, ComponentMappings, Option }
export { createField }
