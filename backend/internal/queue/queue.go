package queue

import (
	"context"
	"sync"
)

type Result struct {
	Data interface{}
	Err  error
}

type Job struct {
	Fn        func() (interface{}, error)
	ResultChan chan<- Result
}

// RequestQueue ограничивает число одновременных запросов и обрабатывает их по очереди (FIFO).
type RequestQueue struct {
	jobs   chan Job
	closed chan struct{}
	wg     sync.WaitGroup
}

// maxConcurrent — сколько запросов обрабатываются параллельно; queueSize — размер буфера (ожидающие).
func NewRequestQueue(maxConcurrent, queueSize int) *RequestQueue {
	if maxConcurrent < 1 {
		maxConcurrent = 1
	}
	if queueSize < 0 {
		queueSize = 0
	}
	q := &RequestQueue{
		jobs:   make(chan Job, queueSize),
		closed: make(chan struct{}),
	}
	for i := 0; i < maxConcurrent; i++ {
		q.wg.Add(1)
		go q.worker()
	}
	return q
}

func (q *RequestQueue) worker() {
	defer q.wg.Done()
	for {
		select {
		case <-q.closed:
			return
		case job, ok := <-q.jobs:
			if !ok {
				return
			}
			data, err := job.Fn()
			select {
			case job.ResultChan <- Result{Data: data, Err: err}:
			default:
				// вызывающий мог отменить ожидание
			}
		}
	}
}

// Submit ставит задачу в очередь и блокируется до получения результата или отмены контекста.
// Если контекст отменён до постановки в очередь, возвращает ctx.Err().
func (q *RequestQueue) Submit(ctx context.Context, job Job) (Result, error) {
	resultChan := make(chan Result, 1)
	job.ResultChan = resultChan
	select {
	case <-ctx.Done():
		return Result{}, ctx.Err()
	case q.jobs <- job:
	}
	select {
	case <-ctx.Done():
		return Result{}, ctx.Err()
	case res := <-resultChan:
		return res, nil
	}
}

// Close останавливает воркеры. Вызывать при завершении приложения.
func (q *RequestQueue) Close() {
	close(q.closed)
	close(q.jobs)
	q.wg.Wait()
}

var Default *RequestQueue

// maxConcurrent и queueSize задаются из конфига.
func Init(maxConcurrent, queueSize int) {
	Default = NewRequestQueue(maxConcurrent, queueSize)
}
