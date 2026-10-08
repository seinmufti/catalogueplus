export type AdminSuccessAction = 'edited' | 'added' | 'deleted' | 'hidden' | 'shown'

export type AdminSuccessDetail = {
  action: AdminSuccessAction
  productKey: string
}

const ACTION_LABEL: Record<AdminSuccessAction, string> = {
  edited: 'Edited',
  added: 'Added',
  deleted: 'Deleted',
  hidden: 'Hidden from catalogue',
  shown: 'Shown on catalogue',
}

export function formatAdminSuccessMessage({ action, productKey }: AdminSuccessDetail): string {
  return `Success: ${productKey} - ${ACTION_LABEL[action]}`
}
