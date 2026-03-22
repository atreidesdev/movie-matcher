/**
 * Переупорядочивает массив по длине подписи: чередует длинные и короткие,
 * чтобы при переносе строк средняя длина на линию была более равномерной.
 * Пример: [длинный, длинный, короткий, короткий] → 3 линии;
 * после балансировки: [длинный, короткий, длинный, короткий] → 2 линии.
 */
export function balanceByLength<T>(items: T[], getLabel: (item: T) => string): T[] {
  if (items.length <= 1) return items
  const withLen = items.map((item) => ({ item, len: getLabel(item).length }))
  withLen.sort((a, b) => b.len - a.len)
  const result: T[] = []
  let i = 0
  let j = withLen.length - 1
  while (i <= j) {
    result.push(withLen[i].item)
    if (i !== j) result.push(withLen[j].item)
    i++
    j--
  }
  return result
}
