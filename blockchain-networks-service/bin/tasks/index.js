const Agenda = require('agenda');
const moment = require('moment-timezone');
const log = require('../utils/logger')(module);

module.exports = async (context) => {
  const db = context.mongo;

  // remove all old sync contracts tasks
  await context.db.Task.deleteMany({ name: 'sync contracts' })

  // Start a new instance of agenda
  const agenda = new Agenda({
    defaultLockLifetime: 120000,
    lockLimit: 50,
    db: { processEvery: '1 seconds', collection: 'Task' },
    mongo: db
  });

  // Agenda listeners for starting, error and processing tasks
  agenda.on('ready', async () => {
    log.info('Agenda > Started');
    await agenda.start();

    // cleanup old tasks
    const removeJobs = await agenda.jobs({ name: 'system remove processed tasks' });

    if (removeJobs.length === 0) {
      await agenda.create('system remove processed tasks')
        .repeatEvery('1 days')
        .schedule(moment()
          .utc()
          .add(1, 'days')
          .startOf('day')
          .toDate())
        .save();
    }

    // start sync processes
    await agenda.create('sync')
      .schedule(moment()
        .utc()
        .add(5, 'minutes')
        .toDate())
      .save();
  });

  agenda.on('error', (err) => {
    log.info('Agenda > Error: ', err);
  });

  agenda.on('success', async task => {
    let info = {};
    let additionalInfo = '';

    switch (task.attrs.name) {
      case 'sync contracts':
        info = { network: task.attrs.data.network };
        await agenda.create('sync products', task.attrs.data)
          .schedule(moment()
            .utc()
            .toDate())
          .save();
        break;
      case 'sync products':
        info = { network: task.attrs.data.network };
        break;
      default:
        break;
    }

    log.info(`Agenda [${ task.attrs.name }][${ task.attrs._id }] > processed with data ${ JSON.stringify(info) }. ${ additionalInfo }`);
  });

  agenda.on('fail', (err) => {
    log.error(`Agenda > Fail: ${ err }`);
  });


  // Application termination
  function graceful() {
    agenda.stop(() => {
      log.info('Agenda > Stopping...');
      process.exit(0);
    });
  }

  process.on('SIGTERM', graceful);
  process.on('SIGINT', graceful);

  return agenda;
};
