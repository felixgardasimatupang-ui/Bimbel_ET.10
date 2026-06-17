import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref && typeof ref === 'object') {
        (ref as React.MutableRefObject<T>).current = node;
      }
    }
  };
}

export function childrenToString(children: ReactNode): string {
  return Children.toArray(children).reduce<string>((acc, child) => {
    if (typeof child === 'string') return acc + child;
    if (typeof child === 'number') return acc + String(child);
    if (isValidElement(child)) {
      const element = child as ReactElement<{ children?: ReactNode }>;
      if (element.props.children) return acc + childrenToString(element.props.children);
    }
    return acc;
  }, '');
}
