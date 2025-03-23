describe('frontend', () => {
    it('is available', function() {
        cy.visit('/')
        cy.get('#app')
    })

    it('displays tasks', function() {
        cy.visit('/')
        cy.get('#screen1').contains('Get water')
    })

    it('creates tasks', function() {
        cy.visit('/')
        cy.get('#screen1').get('button').contains('New Task').click()
        cy.get('#screen2').get('input[name="title"]').type("abc")
        cy.get('#screen2').get('button').contains('Save').click()
        cy.get('#screen1').contains('abc')
    })
})
