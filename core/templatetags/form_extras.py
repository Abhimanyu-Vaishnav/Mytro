from django import template

register = template.Library()

@register.filter(name='add_class')
def add_class(field, css_class):
    return field.as_widget(attrs={"class": css_class})


@register.filter(name='add_attrs')
def add_attrs(field, attrs):
    """Add multiple attributes to a bound field's widget.

    Usage in template:
        {{ form.email|add_attrs:"placeholder=Enter email|data-test=1" }}

    The `attrs` argument can be a string of key=value pairs separated by
    either '|' or ',' or spaces. Values may be quoted.
    """
    if not attrs:
        return field

    # normalize input to dict
    new_attrs = {}
    if isinstance(attrs, str):
        # split by | or ,
        parts = [p.strip() for p in attrs.replace(',', '|').split('|') if p.strip()]
        for part in parts:
            if '=' in part:
                k, v = part.split('=', 1)
                new_attrs[k.strip()] = v.strip().strip('"\'')
            else:
                # treat as class if single token
                # merge into class
                new_attrs.setdefault('class', '')
                if new_attrs['class']:
                    new_attrs['class'] += ' ' + part
                else:
                    new_attrs['class'] = part
    elif isinstance(attrs, dict):
        new_attrs.update(attrs)

    # get existing widget attrs if possible and merge
    try:
        widget_attrs = getattr(field.field.widget, 'attrs', {}) or {}
    except Exception:
        widget_attrs = {}

    merged = dict(widget_attrs)
    for k, v in new_attrs.items():
        if k == 'class' and merged.get('class'):
            merged['class'] = f"{merged.get('class')} {v}".strip()
        else:
            merged[k] = v

    return field.as_widget(attrs=merged)


@register.filter(name='add_placeholder')
def add_placeholder(field, placeholder_text):
    """Shortcut to add a placeholder attribute to a field."""
    return add_attrs(field, f'placeholder={placeholder_text}')


@register.filter(name='add_error_class')
def add_error_class(field, css_class='is-invalid'):
    """Add a CSS class to the field when it has errors.

    Usage:
        {{ form.name|add_error_class:'is-invalid' }}
    """
    try:
        has_errors = bool(getattr(field, 'errors', False))
    except Exception:
        has_errors = False
    if has_errors:
        return add_attrs(field, f'class={css_class}')
    return field


@register.filter(name='field_type')
def field_type(field):
    """Return the widget input type or widget class name for the field."""
    try:
        widget = getattr(field.field, 'widget', None)
        input_type = getattr(widget, 'input_type', None)
        if input_type:
            return input_type
        return widget.__class__.__name__
    except Exception:
        return ''
