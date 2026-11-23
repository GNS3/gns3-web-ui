import { TemplateRef, ViewContainerRef, Signal, computed, effect, inject } from '@angular/core';

/**
 * Shared mechanism of the two privilege structural directives
 * (HasPrivilegeDirective / HasProjectPrivilegeDirective): render the
 * template while the required privileges are held, tear it down when they
 * are not. Subclasses declare their own selector + main input (the input
 * alias must equal the selector for the structural microsyntax) and expose
 * three signals: the required privileges, the list combination mode and
 * the judgement source privilege set.
 */
export abstract class PrivilegeGateDirective {
  /** The privilege names to check (single value or list, per the main input). */
  protected abstract readonly requiredPrivileges: Signal<string | string[]>;
  /** How a privilege list is combined: 'all' (default) or 'any'. */
  protected abstract readonly matchMode: Signal<'all' | 'any'>;
  /** The privilege set every check runs against. */
  protected abstract readonly privilegeSet: Signal<ReadonlySet<string>>;

  private readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly allowed = computed(() => {
    const value = this.requiredPrivileges();
    const required = Array.isArray(value) ? value : [value];
    const privileges = this.privilegeSet();
    return this.matchMode() === 'any'
      ? required.some((privilege) => privileges.has(privilege))
      : required.every((privilege) => privileges.has(privilege));
  });

  protected constructor() {
    effect(() => {
      this.viewContainer.clear();
      if (this.allowed()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
