import { useCallback, useEffect, useState } from "react"

import { ApiError } from "@/lib/api-client"
import type {
  SortDirection,
  SortName,
  StatusFilter,
  SubmissionList,
} from "@/types/api"

import { submissionsApi } from "./submissions-api"

export interface SubmissionQuery {
  status: StatusFilter
  search: string
  sort: SortName
  direction: SortDirection
  page: number
  pageSize: number
}

export function useSubmissionsQuery(
  query: SubmissionQuery,
  refreshKey: number
) {
  const [retryKey, setRetryKey] = useState(0)
  const queryKey = [
    query.status,
    query.search,
    query.sort,
    query.direction,
    query.page,
    query.pageSize,
    refreshKey,
    retryKey,
  ].join(":")
  const [state, setState] = useState<{
    key: string
    data: SubmissionList | null
    error: string
  }>({
    key: "",
    data: null,
    error: "",
  })

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({
      status: query.status,
      sort: query.sort,
      direction: query.direction,
      page: String(query.page),
      page_size: String(query.pageSize),
    })
    if (query.search) params.set("search", query.search)

    submissionsApi
      .list(params, controller.signal)
      .then((data) => setState({ key: queryKey, data, error: "" }))
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError")
          return
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Submissions could not be loaded."
        setState((current) => ({
          key: queryKey,
          data: current.data,
          error: message,
        }))
      })
    return () => controller.abort()
  }, [
    query.status,
    query.search,
    query.sort,
    query.direction,
    query.page,
    query.pageSize,
    queryKey,
  ])

  const retry = useCallback(() => setRetryKey((current) => current + 1), [])
  return {
    data: state.data,
    loading: state.key !== queryKey,
    error: state.key === queryKey ? state.error : "",
    retry,
  }
}
