import { Command } from 'commander'
import { gapsCommand } from './commands/gaps'
import { validateCommand } from './commands/validate'
import { translateCommand } from './commands/translate'
import { iconsCommand } from './commands/icons'
import { extractSymbolsCommand } from './commands/extract-symbols'
import { updateSymbolsCommand } from './commands/update-symbols'

const program = new Command()

program
  .name('dtpr-studio')
  .description('CLI tools for DTPR taxonomy management')
  .version('0.1.0')

program.addCommand(gapsCommand)
program.addCommand(validateCommand)
program.addCommand(translateCommand)
program.addCommand(iconsCommand)
program.addCommand(extractSymbolsCommand)
program.addCommand(updateSymbolsCommand)

program.parse()
