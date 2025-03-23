const today = new Date().toISOString().substring(0, 10).replaceAll('-', '/')
const not_today = new Date(2020, 10, 3).toISOString().substring(0, 10).replaceAll('-', '/')


describe('API', () => {
    it('is available', function() {
        cy.request({
            url: '/api/',
        }).then(response => {
            expect(response).property('body').property('name')
            expect(response).property('body').property('version')
        })
    })

    it('returns correct ids', function() {
        cy.request({
            url: `/api/item/ids/${today}`,
        }).then(response => {
            expect(response).property('body').property('item_ids').to.deep.equal([
                1, 2, 3, 4
            ])

            cy.request({
                url: `/api/item/ids/${not_today}`,
            }).then(response => {
                expect(response).property('body').property('item_ids').to.deep.equal([])
            })
        })
    })

    it('saves changes and returns correct ids after', function() {
        cy.request({
            url: `/api/item/2`,
        }).then(response => {
            expect(response).property('body').property('item').property('completed').to.equal(0)
            
            cy.request({
                url: `/api/item/2`,
                method: 'PUT',
                body: {...response.body.item, completed: 1},
            }).then(response => {
                expect(response).property('status').to.equal(204)

                cy.request({
                    url: `/api/item/2`,
                }).then(response => {
                    expect(response).property('body').property('item').property('completed').to.equal(1)

                    cy.request({
                        url: `/api/item/ids/${today}`,
                    }).then(response => {
                        expect(response).property('body').property('item_ids').to.deep.equal([
                            1, 3, 4
                        ])
                    })
                })
            })
        })
    })

    it('adds new items', function() {
        cy.request({
            url: `/api/item`,
            method: 'POST',
            body: {
                task_id: '1',
                at: today.replaceAll('/', '-'),
            },
        }).then(response => {
            expect(response).property('status').to.equal(201)
            expect(response).property('body').property('id').to.equal(5)
            
            cy.request({
                url: `/api/item/5`
            }).then(response => {
                expect(response).property('body').property('item').to.deep.equal({
                    id: 5,
                    task_id: 1,
                    completed: 0,
                    at: today.replaceAll('/', '-'),
                })
            })
        })
    })

    it('deletes items', function() {
        cy.request({
            url: `/api/item/3`,
            method: 'DELETE',
        }).then(response => {      
            expect(response).property('status').to.equal(204)

            cy.request({
                url: `/api/item/3`,
                failOnStatusCode: false,
            }).then(response => {
                expect(response).property('status').to.equal(404)
                expect(response).property('body').to.deep.equal({})
            })
        })
    })

    it('gets all tasks', function() {
        cy.request({
            url: `/api/task`,
        }).then(response => {
            expect(response).property('body').property('tasks').to.deep.equal([
                {
                    id: 1,
                    title: 'Get water',
                },
                {
                    id: 2,
                    title: 'Sleep for more than 5 hours',
                },
                {
                    id: 3,
                    title: 'Eat breakfast',
                },
            ])
        })
    })

    it('adds new tasks', function() {
        cy.request({
            url: `/api/task`,
            method: 'POST',
            body: {
                title: 'Stop hating writing tests',
            },
        }).then(response => {
            expect(response).property('status').to.equal(201)
            expect(response).property('body').property('id').to.equal(4)
            
            cy.request({
                url: `/api/task/4`
            }).then(response => {
                expect(response).property('body').property('task').to.deep.equal({
                    id: 4,
                    title: 'Stop hating writing tests',
                })
            })
        })
    })
})
