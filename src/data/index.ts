// Single import surface for the data layer. UI imports from `../data`,
// never from the concrete files, so the implementation stays swappable.
export { repository } from './repository'
export type {
  Repository,
  MovementInput,
  MovementFilter,
  TransferInput,
  OrderLineInput,
  CreateOrderInput,
  ProductStock,
} from './repository'
export { CATEGORIES } from './categories'
