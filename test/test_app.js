'use strict';

function injectData(app, data) {
  var d = data || {
    'result': [
      ['service', 'add',
       {'charm': 'cs:precise/wordpress-6',
         'id': 'wordpress', 'exposed': false}],
      ['service', 'add', {'charm': 'cs:precise/mysql-6', 'id': 'mysql'}],
      ['relation', 'add',
       {'interface': 'reversenginx', 'scope': 'global',
         'endpoints': [['wordpress', {'role': 'peer', 'name': 'loadbalancer'}]],
         'id': 'relation-0000000000'}],
      ['relation', 'add',
       {'interface': 'mysql',
         'scope': 'global', 'endpoints':
         [['mysql', {'role': 'server', 'name': 'db'}],
           ['wordpress', {'role': 'client', 'name': 'db'}]],
         'id': 'relation-0000000001'}],
      ['machine', 'add',
       {'agent-state': 'running', 'instance-state': 'running',
         'id': 0, 'instance-id': 'local', 'dns-name': 'localhost'}],
               ['unit', 'add',
                {'machine': 0, 'agent-state': 'started',
          'public-address': '192.168.122.113', 'id': 'wordpress/0'}],
      ['unit', 'add',
       {'machine': 0, 'agent-state': 'started',
                  'public-address': '192.168.122.222', 'id': 'mysql/0'}]],
    'op': 'delta'};
  app.env.dispatch_result(d);
  return app;
}

describe('Application', function() {
  var Y, app, container;

  before(function(done) {
    Y = YUI(GlobalConfig).use('juju-gui', function(Y) {
          container = Y.Node.create('<div id="test" class="container"></div>');
          app = new Y.juju.App({
                  container: container,
                  viewContainer: container
      });
          injectData(app);
          done();
        });

  });

  it('should produce a valid index', function() {
    var container = app.get('container');
    app.render();
    container.getAttribute('id').should.equal('test');
    container.getAttribute('class').should.include('container');
  });

  it('should be able to render the environment view with default data',
     function() {
       app.showView('environment', {db: app.db});
       container.one('svg').should.not.equal(null);
     });

  it('should be able to route objects to internal URLs', function() {
    // take handles to database objects and ensure we can route to the view
    // needed to show them
    var wordpress = app.db.services.getById('wordpress'),
        wp0 = app.db.units.get_units_for_service(wordpress)[0],
        wp_charm = app.db.charms.create({charm_id: wordpress.get('charm')});

    // 'service/wordpress/' is the primary and so other URL are not returned
    app.getModelURL(wordpress).should.equal('/service/wordpress/');
    // however passing 'intent' can force selection of another
    app.getModelURL(wordpress, 'config').should.equal(
        '/service/wordpress/config');

    // service units use argument rewriting (thus not /u/wp/0)
    app.getModelURL(wp0).should.equal('/unit/wordpress-0/');

    // charms also require a mapping but only a name, not a function
    app.getModelURL(wp_charm).should.equal('/charms/' + wp_charm.get('name'));

  });

});